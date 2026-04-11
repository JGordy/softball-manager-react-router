import { SimpleGrid, Card, Stack, Text, Group, Title } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import AchievementCard from "@/components/AchievementCard";
import { sortAchievements } from "@/utils/achievements";

export default function AchievementsList({
    achievements = [],
    players = [],
    user,
}) {
    const validAchievements = sortAchievements(
        achievements.filter((ua) => ua.achievement),
    );

    return (
        <Stack gap="md">
            <Group gap="xs">
                <IconTrophy size={18} />
                <Title order={4} size="h4">
                    Game Achievements
                </Title>
            </Group>

            {validAchievements.length > 0 ? (
                <SimpleGrid cols={1} spacing="md">
                    {validAchievements.map((ua) => {
                        const player = players.find((p) => p.$id === ua.userId);
                        const playerName = player
                            ? [player.firstName, player.lastName]
                                  .filter(Boolean)
                                  .join(" ")
                                  .trim() || "Player"
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
            ) : (
                <Card
                    p="xl"
                    radius="md"
                    withBorder
                    style={{
                        borderStyle: "dashed",
                    }}
                >
                    <Stack align="center" gap="xs">
                        <IconTrophy
                            size={40}
                            stroke={1.5}
                            color="var(--mantine-color-dimmed)"
                        />
                        <Text fw={500} size="sm">
                            No achievements earned yet
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">
                            Trophies appear here as players complete outstanding
                            feats.
                        </Text>
                    </Stack>
                </Card>
            )}
        </Stack>
    );
}
