import { useEffect, useState, useMemo, useRef } from "react";
import { useFetcher } from "react-router";

import { Card, Center, Image, Stack, Text } from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import images from "@/constants/images";
import awardsMap from "@/constants/awards";

import addPlayerAvailability from "../utils/addPlayerAvailability";
import VotesContainer from "./VotesContainer";
import WinnerDisplay from "./WinnerDisplay";

export default function AwardsDrawerContents({
    attendance,
    awards,
    game,
    team,
    players,
    user,
    votes,
}) {
    const [activeAward, setActiveAward] = useState("mvp");
    const [embla, setEmbla] = useState(null);
    const [playerVotes, setPlayerVotes] = useState({});

    console.log({ awards });

    useEffect(() => {
        if (votes) {
            const userVotes = votes.documents.filter(
                (vote) => vote.voter_user_id === user.$id,
            );

            const initialVotes = userVotes.reduce((acc, vote) => {
                acc[vote.reason] = {
                    nominated_user_id: vote.nominated_user_id,
                    vote_id: vote.$id,
                };
                return acc;
            }, {});

            setPlayerVotes(initialVotes);
        }
    }, [votes, user.$id]);

    const fetcher = useFetcher();

    const handleVote = (award, playerId) => {
        setPlayerVotes((prevVotes) => ({
            ...prevVotes,
            [award]: {
                nominated_user_id: playerId,
                vote_id: prevVotes[award]?.vote_id,
            },
        }));
    };

    const handleSubmit = () => {
        try {
            const formData = new FormData();
            formData.append("playerVotes", JSON.stringify(playerVotes));
            formData.append("_action", "send-votes");
            formData.append("team_id", team.$id);
            formData.append("voter_user_id", user.$id);

            fetcher.submit(formData, {
                action: `/events/${game.$id}`,
                method: "post",
            });
        } catch (error) {
            console.error("Error submitting votes:", error);
        }
    };

    const playersWithAvailability = addPlayerAvailability(
        attendance.documents,
        players,
    );

    // Build a map of vote counts per award per player:
    // { [award]: { [playerId]: count } }
    const countsByAward = useMemo(() => {
        const map = {};
        if (!votes?.documents) return map;

        votes.documents.forEach((vote) => {
            const reason = vote.reason;
            const playerId = vote.nominated_user_id;
            if (!reason || !playerId) return;

            if (!map[reason]) map[reason] = {};
            map[reason][playerId] = (map[reason][playerId] || 0) + 1;
        });

        return map;
    }, [votes]);

    // For the currently active award, sort players by vote count (desc).
    const sortedPlayersForActiveAward = useMemo(() => {
        const counts = countsByAward[activeAward] || {};
        return [...playersWithAvailability].sort((a, b) => {
            const ca = counts[a.$id] || 0;
            const cb = counts[b.$id] || 0;

            if (cb !== ca) return cb - ca; // higher votes first

            // tie-breaker: lastName then firstName
            const last = (a.lastName || "").localeCompare(b.lastName || "");
            if (last !== 0) return last;
            return (a.firstName || "").localeCompare(b.firstName || "");
        });
    }, [playersWithAvailability, countsByAward, activeAward]);

    const awardsList = useMemo(() => Object.keys(awardsMap), []);
    const scrolledRef = useRef(false);

    // If the awards documents indicate the current user was awarded something,
    // automatically scroll the carousel to the first matching award.
    useEffect(() => {
        if (scrolledRef.current) return;
        if (!awards?.documents || !embla || !user?.$id) return;

        // Find the first awards document where the winner_user_id matches current user
        const assigned = awards.documents.find(
            (doc) => doc.winner_user_id === user.$id,
        );

        if (!assigned) return;

        const awardKey = assigned.award_type;
        const idx = awardsList.indexOf(awardKey);
        if (idx === -1) return;

        // Delay the scroll slightly so the carousel & drawer have time to layout.
        const timer = setTimeout(() => {
            try {
                embla.scrollTo(idx);
                setActiveAward(awardKey);
                scrolledRef.current = true;
            } catch (e) {
                // embla might throw if not ready; ignore silently
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [awards, embla, user?.$id, awardsList]);

    // Reset the initial-scroll guard when awards data changes (so reopening/new data can re-run)
    useEffect(() => {
        scrolledRef.current = false;
    }, [awards?.documents?.length, awards?.total]);

    return (
        <Stack justify="center" align="stretch">
            <Carousel
                controlsOffset="xs"
                slideSize="85%"
                slideGap="md"
                emblaOptions={{
                    loop: true,
                    dragFree: false,
                    align: "center",
                }}
                getEmblaApi={(api) => setEmbla(api)}
                onSlideChange={(index) => setActiveAward(awardsList[index])}
            >
                {awardsList.map((key) => (
                    <Carousel.Slide key={key}>
                        <Card radius="xl" my="sm">
                            <Center>
                                <Image
                                    src={images[key]}
                                    alt={`${images[key]} icon`}
                                    mah={150}
                                    maw={150}
                                />
                            </Center>
                        </Card>
                    </Carousel.Slide>
                ))}
            </Carousel>

            <Card radius="lg">
                <Text ta="center" size="sm">
                    {awardsMap[activeAward].description}
                </Text>
            </Card>

            {/* If awards.total is greater than 0 voting has concluded; show winners */}
            {awards?.total > 0 ? (
                <WinnerDisplay
                    activeAward={activeAward}
                    players={players}
                    team={team}
                    user={user}
                    votes={votes}
                />
            ) : (
                <VotesContainer
                    activeAward={activeAward}
                    attendance={attendance}
                    game={game}
                    players={players}
                    team={team}
                    user={user}
                    votes={votes}
                />
            )}
        </Stack>
    );
}
