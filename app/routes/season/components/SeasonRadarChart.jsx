import { useMemo, useState, useEffect } from "react";
import {
    Card,
    Group,
    Text,
    Title,
    SegmentedControl,
    Badge,
    Stack,
    Tooltip,
    SimpleGrid,
    Paper,
    Box,
    useMantineColorScheme,
} from "@mantine/core";
import { RadarChart } from "@mantine/charts";
import {
    IconArrowUpRight,
    IconArrowDownRight,
    IconMinus,
} from "@tabler/icons-react";

import {
    calculateGameStats,
    calculateTeamTotals,
    calculateSeasonRadarMetrics,
    PLATFORM_BENCHMARKS,
} from "@/utils/stats";

/**
 * Interactive Radar Chart component for comparing a season's performance metrics
 * against a previous season or platform-wide benchmarks.
 *
 * @param {Object} props - Component props
 * @param {Array} props.games - Current season games
 * @param {Array} props.logs - Current season game logs
 * @param {Array} props.players - Current season roster players
 * @param {Object} [props.previousSeasonData] - Previous season summary ({ season, games, logs })
 * @param {string} [props.primaryColor="lime"] - Primary color accent
 * @returns {JSX.Element} The rendered season radar chart card
 */
export default function SeasonRadarChart({
    games = [],
    logs = [],
    players = [],
    previousSeasonData = null,
}) {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === "dark";

    const hasPrevSeason = Boolean(previousSeasonData?.season);
    const [comparisonMode, setComparisonMode] = useState(
        hasPrevSeason ? "prev" : "platform",
    );

    useEffect(() => {
        if (hasPrevSeason) {
            setComparisonMode("prev");
        }
    }, [hasPrevSeason]);

    // 1. Calculate Current Season Radar Metrics
    const currentMetrics = useMemo(() => {
        const stats = calculateGameStats(logs, players);
        const totals = calculateTeamTotals(stats);
        return calculateSeasonRadarMetrics({ games, totals, logs });
    }, [games, logs, players]);

    // 2. Calculate Previous Season Radar Metrics
    const prevMetrics = useMemo(() => {
        if (!hasPrevSeason) return null;
        const prevStats = calculateGameStats(previousSeasonData.logs || [], []);
        const prevTotals = calculateTeamTotals(prevStats);
        return calculateSeasonRadarMetrics({
            games: previousSeasonData.games || [],
            totals: prevTotals,
            logs: previousSeasonData.logs || [],
        });
    }, [hasPrevSeason, previousSeasonData]);

    // 3. Calculate Platform Benchmark Metrics
    const platformMetrics = useMemo(() => {
        const fakeTotals = {
            H: Math.round(PLATFORM_BENCHMARKS.HitsPerGame * 10),
            AVG: PLATFORM_BENCHMARKS.AVG.toFixed(3),
            SLG: PLATFORM_BENCHMARKS.SLG.toFixed(3),
        };
        const fakeGames = Array.from({ length: 10 }, () => ({
            score: PLATFORM_BENCHMARKS.RPG,
            opponentScore: PLATFORM_BENCHMARKS.RAPG,
            result: "W",
        }));
        return calculateSeasonRadarMetrics({
            games: fakeGames,
            totals: fakeTotals,
        });
    }, []);

    // Active comparison target
    const activeComparison =
        comparisonMode === "prev" && prevMetrics
            ? prevMetrics
            : platformMetrics;

    const comparisonLabel =
        comparisonMode === "prev"
            ? previousSeasonData?.season?.seasonName || "Previous Season"
            : "Average Team";

    const hasHittingData = currentMetrics.loggedGamesCount > 0;

    // Build data array for Mantine RadarChart with raw metric values embedded in labels
    const chartData = useMemo(() => {
        const scores =
            comparisonMode === "platform"
                ? currentMetrics.platformScores
                : currentMetrics.fixedScores;

        const compScores =
            comparisonMode === "platform"
                ? activeComparison.platformScores
                : activeComparison.fixedScores;

        const formattedNetDiff =
            currentMetrics.raw.NetDiff > 0
                ? `+${currentMetrics.raw.NetDiff}`
                : `${currentMetrics.raw.NetDiff}`;

        return [
            {
                metric: `RPG: ${currentMetrics.raw.RPG}`,
                Current: scores.RPG,
                Comparison: compScores.RPG,
            },
            {
                metric: `HPG: ${hasHittingData ? currentMetrics.raw.HPG : "N/A"}`,
                Current: hasHittingData ? scores.HPG : 0,
                Comparison: compScores.HPG,
            },
            {
                metric: `AVG: ${hasHittingData ? currentMetrics.raw.AVG : "N/A"}`,
                Current: hasHittingData ? scores.AVG : 0,
                Comparison: compScores.AVG,
            },
            {
                metric: `SLG: ${hasHittingData ? currentMetrics.raw.SLG : "N/A"}`,
                Current: hasHittingData ? scores.SLG : 0,
                Comparison: compScores.SLG,
            },
            {
                metric: `DIFF: ${formattedNetDiff}`,
                Current: scores.NetDiff,
                Comparison: compScores.NetDiff,
            },
            {
                metric: `DEF: ${currentMetrics.raw.RAPG}`,
                Current: scores.Defense,
                Comparison: compScores.Defense,
            },
        ];
    }, [currentMetrics, activeComparison, comparisonMode, hasHittingData]);

    // Color definitions using Mantine theme palette
    const currentColor = "lime.5";
    const comparisonColor = "cyan.5";

    // Format Delta values for display
    const deltas = useMemo(() => {
        const calcDiff = (curr, comp) => {
            const numCurr = typeof curr === "string" ? parseFloat(curr) : curr;
            const numComp = typeof comp === "string" ? parseFloat(comp) : comp;
            if (isNaN(numCurr) || isNaN(numComp)) return 0;
            return parseFloat((numCurr - numComp).toFixed(3));
        };

        return {
            RPG: calcDiff(currentMetrics.raw.RPG, activeComparison.raw.RPG),
            HPG: calcDiff(currentMetrics.raw.HPG, activeComparison.raw.HPG),
            AVG: calcDiff(currentMetrics.raw.AVG, activeComparison.raw.AVG),
            SLG: calcDiff(currentMetrics.raw.SLG, activeComparison.raw.SLG),
        };
    }, [currentMetrics, activeComparison]);

    const renderDeltaBadge = (label, diff, suffix = "") => {
        const isHittingMetric =
            label === "AVG" || label === "SLG" || label === "HPG";
        if (isHittingMetric && !hasHittingData) {
            return (
                <Tooltip
                    label={`No game log hitting data available for ${label}`}
                    key={label}
                >
                    <Badge
                        variant="light"
                        color="gray"
                        size="sm"
                        leftSection={<IconMinus size={12} />}
                    >
                        {label}: No Data
                    </Badge>
                </Tooltip>
            );
        }

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
                label={`${label} difference vs ${comparisonLabel}`}
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

    return (
        <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
                <Group justify="flex-end" align="center">
                    <SegmentedControl
                        size="xs"
                        value={comparisonMode}
                        onChange={setComparisonMode}
                        data={[
                            {
                                label: "vs. Avg Team",
                                value: "platform",
                            },
                            ...(hasPrevSeason
                                ? [
                                      {
                                          label: "vs. Prev Season",
                                          value: "prev",
                                      },
                                  ]
                                : []),
                        ]}
                    />
                </Group>

                <Box
                    style={{
                        width: "100%",
                        margin: "0 auto",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 240,
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
                        h={225}
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
                                name: "Current",
                                color: currentColor,
                                opacity: 0.5,
                            },
                            {
                                name: "Comparison",
                                color: comparisonColor,
                                opacity: 0.3,
                            },
                        ]}
                    />
                </Box>

                {/* Legend & Summary */}
                <Group justify="space-between" align="center" wrap="wrap">
                    <Group gap="xs">
                        <Badge size="sm" variant="filled" color="lime">
                            Current Season
                        </Badge>
                        <Badge size="sm" variant="outline" color="cyan">
                            {comparisonLabel}
                        </Badge>
                    </Group>

                    {/* Compact Delta Indicators */}
                    <Group gap="xs" wrap="wrap">
                        {renderDeltaBadge("RPG", deltas.RPG)}
                        {renderDeltaBadge("AVG", deltas.AVG)}
                        {renderDeltaBadge("SLG", deltas.SLG)}
                    </Group>
                </Group>

                {/* Raw Metric Values Grid */}
                <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="xs" mt="xs">
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Runs / Gm
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {currentMetrics.raw.RPG}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Hits / Gm
                        </Text>
                        <Text
                            fw={700}
                            size="sm"
                            c={hasHittingData ? "lime.5" : "dimmed"}
                        >
                            {hasHittingData ? currentMetrics.raw.HPG : "N/A"}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Team AVG
                        </Text>
                        <Text
                            fw={700}
                            size="sm"
                            c={hasHittingData ? "lime.5" : "dimmed"}
                        >
                            {hasHittingData ? currentMetrics.raw.AVG : "N/A"}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Team SLG
                        </Text>
                        <Text
                            fw={700}
                            size="sm"
                            c={hasHittingData ? "lime.5" : "dimmed"}
                        >
                            {hasHittingData ? currentMetrics.raw.SLG : "N/A"}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Net Diff
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {currentMetrics.raw.NetDiff > 0
                                ? `+${currentMetrics.raw.NetDiff}`
                                : currentMetrics.raw.NetDiff}
                        </Text>
                    </Paper>
                    <Paper p="xs" withBorder ta="center" radius="sm">
                        <Text size="xs" c="dimmed" fw={600}>
                            Runs Allowed
                        </Text>
                        <Text fw={700} size="sm" c="lime.5">
                            {currentMetrics.raw.RAPG}
                        </Text>
                    </Paper>
                </SimpleGrid>

                {currentMetrics.hasLegacyUnloggedGames && (
                    <Text size="xs" c="dimmed" fs="italic" ta="center">
                        * Hitting averages calculated across{" "}
                        {currentMetrics.loggedGamesCount} logged game(s) (legacy
                        unlogged games excluded).
                    </Text>
                )}
            </Stack>
        </Card>
    );
}
