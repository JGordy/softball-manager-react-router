import { useEffect, useState, useMemo, useRef } from "react";

import { Card, Center, Image, Stack, Text } from "@mantine/core";
import { Carousel } from "@mantine/carousel";

import images from "@/constants/images";
import awardsMap from "@/constants/awards";

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
                            <Text ta="center" size="sm">
                                {awardsMap[activeAward].description}
                            </Text>
                        </Card>
                    </Carousel.Slide>
                ))}
            </Carousel>

            {/* If awards.total is greater than 0 voting has concluded; show winners */}
            {awards?.total > 0 ? (
                <WinnerDisplay
                    activeAward={activeAward}
                    game={game}
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
