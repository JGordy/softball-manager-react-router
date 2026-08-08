import { useMemo } from "react";
import {
    Card,
    Group,
    Text,
    Badge,
    Stack,
    Tooltip,
    SimpleGrid,
    Paper,
    Box,
} from "@mantine/core";
import { RadarChart } from "@mantine/charts";
import {
    IconArrowUpRight,
    IconArrowDownRight,
    IconMinus,
} from "@tabler/icons-react";

import { calculatePlayerRadarMetrics } from "@/utils/stats";

/**
 * Interactive Radar Chart component for comparing a player's hitting metrics
 * (Hits/Gm, RBIs/Gm, Runs/Gm, AVG, SLG, OPS) against live platform averages.
 *
 * @param {Object} props - Component props
 * @param {Object} props.overallStats - Calculated player statistics from calculatePlayerStats
 * @param {number} props.gameCountWithLogs - Count of unique games with detailed logs for the player
 * @param {Object} [props.platformBenchmarks] - Optional platform benchmark overrides
 * @returns {JSX.Element} The rendered player performance radar chart card
 */
export default function PlayerRadarChart({
    overallStats,
    gameCountWithLogs = 0,
    platformBenchmarks,
}) {
    // Calculate player & platform radar metrics
    const metrics = useMemo(() => {
        return calculatePlayerRadarMetrics({
            overallStats,
            gameCountWithLogs,
            platformBenchmarks,
        });
    }, [overallStats, gameCountWithLogs, platformBenchmarks]);

    const { radarData, raw, platformRaw } = metrics;
    const hasData = gameCountWithLogs > 0 && radarData.length > 0;

    // Chart series formatting
    const chartData = useMemo(() => {
        if (!hasData) return [];
        return radarData.map((item) => ({
            metric: `${item.metric}: ${item.playerRaw}`,
            Player: item.playerScore,
            Platform: item.platformScore,
        }));
    }, [radarData, hasData]);

    // Calculate metric deltas vs platform average
    const deltas = useMemo(() => {
        if (!hasData) return {};
        const calcDiff = (playerVal, platformVal) => {
            const pVal = parseFloat(playerVal || "0");
            const pfVal = parseFloat(platformVal || "0");
            if (isNaN(pVal) || isNaN(pfVal)) return 0;
            return parseFloat((pVal - pfVal).toFixed(3));
        };

        return {
            HPG: calcDiff(raw.HPG, platformRaw.HPG),
            RBIPG: calcDiff(raw.RBIPG, platformRaw.RBIPG),
            RPG: calcDiff(raw.RPG, platformRaw.RPG),
            AVG: calcDiff(raw.AVG, platformRaw.AVG),
            SLG: calcDiff(raw.SLG, platformRaw.SLG),
            OPS: calcDiff(raw.OPS, platformRaw.OPS),
        };
    }, [raw, platformRaw, hasData]);

    const renderDeltaBadge = (label, diff, suffix = "") => {
        if (!hasData) return null;

        const isPositive = diff > 0;
        const isZero = diff === 0;
        const color = isZero ? "gray" : isPositive ? "teal" : "red";
        const Icon = isZero
            ? IconMinus
            : isPositive
              ? IconArrowUpRight
              : IconArrowDownRight;

        const formattedDiff = isPositive
            ? `+${diff}${suffix}`
            : `${diff}${suffix}`;

        return (
            <Tooltip
                label={`${label} difference vs Player Average`}
                key={label}
            >
                <Badge
                    variant="light"
                    color={color}
                    size="sm"
                    leftSection={<Icon size={12} />}
                >
                    {label}: {formattedDiff}
                </Badge>
            </Tooltip>
        );
    };

    if (!hasData) {
        return null;
    }

    return (
        <Card withBorder padding="md" radius="md">
            <Stack gap="sm">
                <Group justify="flex-end" align="center">
                    <Group gap="xs">
                        <Badge size="xs" variant="filled" color="lime">
                            Player
                        </Badge>
                        <Badge size="xs" variant="outline" color="cyan">
                            Player Avg
                        </Badge>
                    </Group>
                </Group>

                <Box
                    style={{
                        width: "100%",
                        margin: "0 auto",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 220,
                    }}
                >
                    <style>{`
                        .mantine-RadarChart-container {
                            width: 100% !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: center !important;
                        }
                        .mantine-RadarChart-container > div {
                            width: 100% !important;
                            height: 100% !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: center !important;
                        }
                        .recharts-wrapper {
                            margin: 0 auto !important;
                            left: 0 !important;
                            right: 0 !important;
                        }
                    `}</style>
                    <RadarChart
                        cx="50%"
                        cy="50%"
                        h={210}
                        w="100%"
                        data={chartData}
                        dataKey="metric"
                        withPolarGrid
                        withPolarAngleAxis
                        polarAngleAxisProps={{
                            stroke: "var(--mantine-color-text)",
                            tick: {
                                fill: "var(--mantine-color-text)",
                                fontSize: 11,
                                fontWeight: 600,
                            },
                        }}
                        gridColor="var(--mantine-color-default-border)"
                        series={[
                            {
                                name: "Player",
                                color: "lime.5",
                                opacity: 0.5,
                            },
                            {
                                name: "Platform",
                                color: "cyan.5",
                                opacity: 0.25,
                            },
                        ]}
                    />
                </Box>

                {/* Delta badges */}
                <Group gap="xs" wrap="wrap" justify="center">
                    {renderDeltaBadge("AVG", deltas.AVG)}
                    {renderDeltaBadge("OPS", deltas.OPS)}
                    {renderDeltaBadge("HPG", deltas.HPG)}
                </Group>

                {/* Raw Metric Cards */}
                <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="xs" mt="xs">
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Hits / Gm
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {raw.HPG}
                        </Text>
                        <Text size="10px" c="dimmed">
                            vs {platformRaw.HPG}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            RBIs / Gm
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {raw.RBIPG}
                        </Text>
                        <Text size="10px" c="dimmed">
                            vs {platformRaw.RBIPG}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Runs / Gm
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {raw.RPG}
                        </Text>
                        <Text size="10px" c="dimmed">
                            vs {platformRaw.RPG}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            AVG
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {raw.AVG}
                        </Text>
                        <Text size="10px" c="dimmed">
                            vs {platformRaw.AVG}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            SLG
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {raw.SLG}
                        </Text>
                        <Text size="10px" c="dimmed">
                            vs {platformRaw.SLG}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            OPS
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {raw.OPS}
                        </Text>
                        <Text size="10px" c="dimmed">
                            vs {platformRaw.OPS}
                        </Text>
                    </Paper>
                </SimpleGrid>

                <Text size="xs" c="dimmed" fs="italic" ta="center">
                    * Per-game metrics calculated across {gameCountWithLogs}{" "}
                    logged game(s) (games without detailed logs excluded).
                </Text>
            </Stack>
        </Card>
    );
}
