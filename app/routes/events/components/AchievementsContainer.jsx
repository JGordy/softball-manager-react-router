import { Suspense } from "react";
import { Await } from "react-router";

import { Card, Text, Title, SimpleGrid, Group } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";

import AchievementCard from "@/components/AchievementCard";
import LoaderDots from "@/components/LoaderDots";

export default function AchievementsContainer({ deferredData, user }) {
    if (!deferredData?.achievements) return null;

    return (
        <Card p="md" radius="md" withBorder mt="md">
            <Group mb="md" gap="xs">
                <IconTrophy size={20} />
                <Title order={3}>Game Achievements</Title>
            </Group>

            <Suspense fallback={<LoaderDots />}>
                <Await resolve={deferredData.achievements}>
                    {(achievements) => {
                        if (!achievements || achievements.length === 0) {
                            return (
                                <Text c="dimmed" size="sm" ta="center" py="xl">
                                    No achievements unlocked in this game.
                                </Text>
                            );
                        }

                        // Filter out empty achievements if the relationship/join failed
                        const validAchievements = achievements.filter(ua => ua.achievement);

                        if (validAchievements.length === 0) {
                            return (
                                <Text c="dimmed" size="sm" ta="center" py="xl">
                                    No achievements unlocked in this game.
                                </Text>
                            );
                        }

                        return (
                            <SimpleGrid
                                cols={{ base: 1, sm: 2 }}
                                spacing="md"
                            >
                                {validAchievements.map((ua) => (
                                    <AchievementCard
                                        key={ua.$id}
                                        achievement={ua.achievement}
                                        unlockedAt={ua.$createdAt}
                                        isMe={ua.userId === user?.$id}
                                        playerName={ua.userId === user?.$id ? "YOU" : null}
                                    />
                                ))}
                            </SimpleGrid>
                        );
                    }}
                </Await>
            </Suspense>
        </Card>
    );
}
