import { Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconTrophy, IconAward, IconUserCheck } from "@tabler/icons-react";

/**
 * Displays engagement metrics for post-game voting, game awards assigned,
 * and player achievements unlocked, including per-game averages.
 *
 * @param {{ stats: {
 *   votes: { total: number, perGame: string },
 *   awards: { total: number, perGame: string },
 *   achievements: { total: number, perGame: string }
 * }}} props
 * @returns {JSX.Element|null}
 */
export const RecognitionStats = ({ stats }) => {
    if (!stats) return null;

    const { votes = {}, awards = {}, achievements = {} } = stats;

    const items = [
        {
            icon: IconUserCheck,
            color: "blue",
            title: "Game Votes",
            total: votes.total || 0,
            perGame: votes.perGame || "0",
            subtitle: "Votes submitted for MVPs",
        },
        {
            icon: IconAward,
            color: "yellow",
            title: "Game Awards",
            total: awards.total || 0,
            perGame: awards.perGame || "0",
            subtitle: "Post-game awards assigned",
        },
        {
            icon: IconTrophy,
            color: "lime",
            title: "Achievements",
            total: achievements.total || 0,
            perGame: achievements.perGame || "0",
            subtitle: "Player badges unlocked",
        },
    ];

    return (
        <SimpleGrid cols={{ base: 1, sm: 3 }} gap="sm" mb="sm">
            {items.map((item) => (
                <Paper key={item.title} withBorder p="md" radius="md">
                    <Group justify="space-between" align="flex-start" mb="xs">
                        <Stack gap={2}>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                {item.title}
                            </Text>
                            <Title order={3}>
                                {item.total.toLocaleString()}
                            </Title>
                        </Stack>
                        <item.icon
                            size={22}
                            color={`var(--mantine-color-${item.color}-4)`}
                        />
                    </Group>
                    <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                            {item.subtitle}
                        </Text>
                        <Text size="xs" fw={700} c={item.color}>
                            {item.perGame} / game
                        </Text>
                    </Group>
                </Paper>
            ))}
        </SimpleGrid>
    );
};
