import { useEffect, useState, useMemo, useRef } from "react";

import { Card, Center, Image, Stack, Text, SimpleGrid, Box, Alert, Tabs } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { IconTrophy } from "@tabler/icons-react";

import images from "@/constants/images";
import awardsMap from "@/constants/awards";

import AchievementCard from "@/components/AchievementCard";
import TabsWrapper from "@/components/TabsWrapper";

import { sortAchievements } from "@/utils/achievements";

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
    achievements,
}) {
    const [activeAward, setActiveAward] = useState("mvp");
    const [embla, setEmbla] = useState(null);

    const awardsList = useMemo(() => Object.keys(awardsMap), []);
    const scrolledRef = useRef(false);

    const validAchievements = useMemo(() => {
        const list = (achievements || []).filter((ua) => ua.achievement);
        return sortAchievements(list);
    }, [achievements]);

    // If the awards documents indicate the current user was awarded something,
    // automatically scroll the carousel to the first matching award.
    useEffect(() => {
        if (scrolledRef.current) return;
        if (!awards?.rows || !embla || !user?.$id) return;

        // Find the first awards document where the winner_user_id matches current user
        const assigned = awards.rows.find(
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
    }, [awards?.rows?.length, awards?.total]);

    const awardsContent = (
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

    const achievementsContent = validAchievements.length > 0 ? (
        <Stack mt="md" gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {validAchievements.map((ua) => {
                    const player = (players || []).find(p => p.$id === ua.userId);
                    const playerName = player
                        ? [player.firstName, player.lastName].filter(Boolean).join(" ").trim() || "Player"
                        : "Player";
                    const isMe = ua.userId === user?.$id;

                    return (
                        <AchievementCard
                            key={ua.$id}
                            achievement={ua.achievement}
                            unlockedAt={ua.$createdAt}
                            playerName={isMe ? "YOU" : playerName}
                            isMe={isMe}
                        />
                    );
                })}
            </SimpleGrid>
        </Stack>
    ) : (
        <Box py="xl">
            <Alert
                icon={<IconTrophy size={16} />}
                title="No Achievements Earned"
                color="gray"
                radius="md"
            >
                No achievements were unlocked in this game. Keep playing to earn trophies for you and your teammates!
            </Alert>
        </Box>
    );



    return (
        <TabsWrapper defaultValue="awards" mt="xs">
            <Tabs.Tab value="awards">Voting & Awards</Tabs.Tab>
            <Tabs.Tab value="achievements">
                Achievements
            </Tabs.Tab>

            <Tabs.Panel value="awards" pt="md">
                {awardsContent}
            </Tabs.Panel>
            <Tabs.Panel value="achievements" pt="md">
                {achievementsContent}
            </Tabs.Panel>
        </TabsWrapper>
    );
}
