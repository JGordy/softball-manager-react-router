import { useEffect, useState, useMemo } from "react";
import { useFetcher } from "react-router";

import {
    Button,
    Card,
    Center,
    Group,
    Image,
    Radio,
    ScrollArea,
    Stack,
    Text,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import images from "@/constants/images";
import awardsMap from "@/constants/awards";

import classes from "@/styles/inputs.module.css";

import addPlayerAvailability from "../utils/addPlayerAvailability";

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
    const [playerVotes, setPlayerVotes] = useState({});

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

    const awardsList = Object.keys(awardsMap);

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

            <ScrollArea.Autosize h="40vh">
                <Card radius="lg">
                    <Text ta="center" size="sm">
                        {awardsMap[activeAward].description}
                    </Text>
                </Card>

                <Stack mt="md" justify="space-between">
                    <Text fw="bold">Vote for a Player:</Text>
                    <Radio.Group
                        value={playerVotes[activeAward]?.nominated_user_id}
                        onChange={(value) => handleVote(activeAward, value)}
                    >
                        <Stack>
                            {sortedPlayersForActiveAward.map((player) => {
                                const count = countsByAward[activeAward]?.[
                                    player.$id
                                ]
                                    ? countsByAward[activeAward][player.$id]
                                    : 0;

                                return (
                                    <Radio.Card
                                        className={classes.radioCard}
                                        key={player.$id}
                                        value={player.$id}
                                        checked={
                                            playerVotes[activeAward]
                                                ?.nominated_user_id ===
                                            player.$id
                                        }
                                        radius="lg"
                                    >
                                        <Card radius="lg" py="sm" px="md">
                                            <Group justify="space-between">
                                                <Group>
                                                    <Radio.Indicator />
                                                    <Text>
                                                        {player.firstName}{" "}
                                                        {player.lastName}
                                                    </Text>
                                                </Group>

                                                {count > 0 && (
                                                    <Text size="sm" c="dimmed">
                                                        {count} vote
                                                        {count === 1 ? "" : "s"}
                                                    </Text>
                                                )}
                                            </Group>
                                        </Card>
                                    </Radio.Card>
                                );
                            })}
                        </Stack>
                    </Radio.Group>
                </Stack>
            </ScrollArea.Autosize>
            <Button
                variant="filled"
                radius="md"
                mt="md"
                type="submit"
                size="lg"
                loading={fetcher.state === "submitting"}
                onClick={handleSubmit}
                autoContrast
                fullWidth
            >
                Submit Votes
            </Button>
        </Stack>
    );
}
