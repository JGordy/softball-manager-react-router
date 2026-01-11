import { Badge, Card, Group, Text, UnstyledButton } from "@mantine/core";
import { DateTime } from "luxon";

import { calculatePlayerStats } from "@/utils/stats";

export default function GameStatsCard({ game, logs, onClick }) {
    const stats = calculatePlayerStats(logs);
    const date = DateTime.fromISO(game.gameDate).toLocaleString(
        DateTime.DATE_MED,
    );

    const relevantHits = [];
    if (stats.details["2B"] > 0) relevantHits.push("2B");
    if (stats.details["3B"] > 0) relevantHits.push("3B");
    if (stats.details.HR > 0) relevantHits.push("HR");

    const extrasText =
        relevantHits.length > 0 ? `[${relevantHits.join(", ")}]` : "";

    return (
        <UnstyledButton onClick={onClick} style={{ width: "100%" }}>
            <Card withBorder radius="md" py="xs">
                <Group justify="space-between" mb="xs">
                    <Text fw={700} size="md">
                        vs {game.opponent || "Opponent"}
                    </Text>
                    <Text size="sm" c="dimmed">
                        {date}
                    </Text>
                </Group>

                <Group align="center" justify="space-between">
                    <Group>
                        <Text fw={700} size="lg">
                            {stats.hits}/{stats.ab}
                        </Text>

                        {extrasText && (
                            <Text size="md" fw={500} c="dimmed">
                                {extrasText}
                            </Text>
                        )}
                    </Group>

                    {stats.rbi > 0 && (
                        <Badge
                            variant="filled"
                            color="blue"
                            size="md"
                            radius="xl"
                        >
                            {stats.rbi} RBI
                        </Badge>
                    )}
                </Group>
            </Card>
        </UnstyledButton>
    );
}
