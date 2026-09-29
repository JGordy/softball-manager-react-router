import { useState, useMemo } from "react";
import {
    Box,
    Group,
    Paper,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
    Badge,
} from "@mantine/core";
import { AreaChart } from "@mantine/charts";
import {
    IconArrowUpRight,
    IconArrowDownRight,
    IconMinus,
    IconChartLine,
    IconInfoCircle,
} from "@tabler/icons-react";

import { BATTING_METRIC_CONFIGS } from "@/constants/metrics";
import { calculatePlayerProgression } from "@/utils/stats";
import { trackEvent } from "@/utils/analytics";

const METRIC_CONFIGS = BATTING_METRIC_CONFIGS;

const getMantineColorVar = (colorToken) =>
    `var(--mantine-color-${colorToken.replace(".", "-")})`;

const CARD_SURFACE_STYLE = {
    backgroundColor:
        "light-dark(var(--mantine-color-gray-0), rgba(255, 255, 255, 0.03))",
    borderColor:
        "light-dark(var(--mantine-color-gray-3), rgba(255, 255, 255, 0.08))",
};

const ALL_SERIES = Object.entries(METRIC_CONFIGS).map(([key, config]) => ({
    name: key,
    label: config.shortLabel,
    color: config.color,
}));

const SEGMENTED_CONTROL_DATA = [
    { label: "All", value: "All" },
    ...Object.keys(METRIC_CONFIGS).map((key) => ({
        label: key,
        value: key,
    })),
];

/**
 * Custom interactive tooltip themed for both dark and light modes.
 */
function CustomProgressionTooltip({ payload, selectedMetric }) {
    if (!payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    const {
        dateLabel,
        fullDate,
        opponent,
        teamName,
        gameStats,
        cumulative,
        deltas,
    } = dataPoint;

    const renderDelta = (delta) => {
        if (delta === 0 || delta === undefined) {
            return (
                <Group gap={2}>
                    <IconMinus size={12} color="gray" />
                    <Text size="xs" c="dimmed">
                        0.000
                    </Text>
                </Group>
            );
        }
        const isPos = delta > 0;
        const Icon = isPos ? IconArrowUpRight : IconArrowDownRight;
        const color = isPos ? "teal" : "red";
        const sign = isPos ? "+" : "";
        return (
            <Group gap={2}>
                <Icon size={12} color={`var(--mantine-color-${color}-5)`} />
                <Text size="xs" c={color} fw={600}>
                    {sign}
                    {delta.toFixed(3)}
                </Text>
            </Group>
        );
    };

    return (
        <Paper
            p="xs"
            withBorder
            shadow="xl"
            radius="md"
            style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-card)",
                minWidth: 220,
                maxWidth: 290,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            }}
        >
            {/* Header: Date & Opponent */}
            <Group justify="space-between" align="flex-start" gap="xs">
                <Stack gap={1}>
                    <Text size="xs" fw={700} c="bright">
                        vs {opponent}
                    </Text>
                    {teamName && (
                        <Text size="10px" c="dimmed">
                            {teamName}
                        </Text>
                    )}
                </Stack>
                <Badge size="xs" variant="light" color="lime">
                    {fullDate || dateLabel}
                </Badge>
            </Group>

            {/* Game Performance Pill */}
            <Paper
                p="4px 8px"
                mt="xs"
                radius="sm"
                withBorder
                style={{
                    backgroundColor:
                        "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))",
                    borderColor:
                        "light-dark(var(--mantine-color-gray-3), rgba(255, 255, 255, 0.08))",
                }}
            >
                <Group justify="space-between" align="center">
                    <Text size="11px" fw={600}>
                        Game: {gameStats.line}
                    </Text>
                    {gameStats.extraText && (
                        <Text size="11px" c="dimmed" fw={500}>
                            {gameStats.extraText}
                        </Text>
                    )}
                    <Text size="10px" c="dimmed">
                        {gameStats.runs} R • {gameStats.rbi} RBI
                    </Text>
                </Group>
            </Paper>

            {/* Cumulative Rates */}
            <Stack gap={4} mt="xs">
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                    Averages to Date ({cumulative.hits}/{cumulative.ab})
                </Text>

                {selectedMetric === "All" ? (
                    <SimpleGrid cols={2} spacing="4px">
                        {Object.entries(METRIC_CONFIGS).map(([key, config]) => {
                            const val = cumulative[key.toLowerCase()];
                            const delta = deltas[key.toLowerCase()];
                            return (
                                <Group
                                    key={key}
                                    justify="space-between"
                                    p="2px 4px"
                                >
                                    <Text size="xs" c={config.color} fw={700}>
                                        {config.shortLabel}:
                                    </Text>
                                    <Group gap={4}>
                                        <Text size="xs" fw={600}>
                                            {val}
                                        </Text>
                                        {renderDelta(delta)}
                                    </Group>
                                </Group>
                            );
                        })}
                    </SimpleGrid>
                ) : (
                    <Group justify="space-between" align="center">
                        <Stack gap={0}>
                            <Text
                                size="sm"
                                fw={700}
                                c={METRIC_CONFIGS[selectedMetric]?.color}
                            >
                                {METRIC_CONFIGS[selectedMetric]?.label}
                            </Text>
                            <Text size="10px" c="dimmed">
                                Cumulative
                            </Text>
                        </Stack>
                        <Stack gap={0} align="flex-end">
                            <Text size="md" fw={700}>
                                {cumulative[selectedMetric.toLowerCase()]}
                            </Text>
                            {renderDelta(deltas[selectedMetric.toLowerCase()])}
                        </Stack>
                    </Group>
                )}
            </Stack>
        </Paper>
    );
}

/**
 * Interactive Area Chart component tracking batting metrics over time (game by game).
 * Supports viewing all metrics together as a trendline or drilling down into individual
 * rate metrics with customized dynamic Y-axis domains.
 *
 * @param {Object} props
 * @param {Array} props.logs - Player game logs
 * @param {Array|Object} props.games - Games map or array
 * @param {Array} [props.teams] - Teams array
 * @param {string} props.userId - Player user ID
 * @param {Array<string>} [props.gameIds] - Optional game ID filter
 * @returns {JSX.Element} Rendered progression chart card
 */
export default function PlayerProgressionChart({
    logs = [],
    games = [],
    teams = [],
    userId,
    gameIds = null,
}) {
    const [selectedMetric, setSelectedMetric] = useState("All");

    /**
     * Handles switching the selected metric filter.
     *
     * @param {string} val - Next selected metric (e.g. 'All', 'AVG', 'OBP')
     */
    const handleMetricChange = (val) => {
        setSelectedMetric(val);
        trackEvent("player-trends-metric-changed", {
            userId,
            metric: val,
        });
    };

    // Compute game-by-game progression data
    const { progression, summary } = useMemo(() => {
        return calculatePlayerProgression({
            logs,
            games,
            teams,
            userId,
            gameIds,
        });
    }, [logs, games, teams, userId, gameIds]);

    const hasEnoughData = progression.length >= 2;

    // Series definition based on selected metric
    const series = useMemo(() => {
        if (selectedMetric === "All") {
            return ALL_SERIES;
        }
        const config = METRIC_CONFIGS[selectedMetric];
        return config
            ? [
                  {
                      name: selectedMetric,
                      label: config.label,
                      color: config.color,
                  },
              ]
            : ALL_SERIES;
    }, [selectedMetric]);

    // Calculate dynamic Y-axis domain when an individual metric is chosen
    const yAxisDomain = useMemo(() => {
        if (selectedMetric === "All" || !hasEnoughData) {
            return [0, "auto"];
        }

        const values = progression
            .map((p) => p[selectedMetric])
            .filter((v) => typeof v === "number" && !isNaN(v));

        if (!values.length) return [0, 1];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const padding = range === 0 ? 0.05 : Math.max(0.02, range * 0.2);

        const domainMin = Math.max(0, parseFloat((min - padding).toFixed(3)));
        const domainMax = parseFloat((max + padding).toFixed(3));

        return [domainMin, domainMax];
    }, [selectedMetric, progression, hasEnoughData]);

    if (!hasEnoughData) {
        return (
            <Paper p="xl" radius="md" withBorder ta="center">
                <Stack align="center" gap="sm">
                    <IconChartLine
                        size={40}
                        color="var(--mantine-color-dimmed)"
                    />
                    <Text fw={600} size="md">
                        Not Enough Game Data
                    </Text>
                    <Text size="sm" c="dimmed" maw={320}>
                        At least 2 logged games with hitting stats are required
                        to plot your performance over time. As you score more
                        games, your trendlines will appear here.
                    </Text>
                </Stack>
            </Paper>
        );
    }

    const { current, highs, lows, netChanges } = summary;
    const activeConfig = METRIC_CONFIGS[selectedMetric];

    return (
        <Stack gap="md" w="100%">
            {/* Metric Selector Controls highlighted in brand lime */}
            <SegmentedControl
                value={selectedMetric}
                onChange={handleMetricChange}
                color="lime"
                fullWidth
                size="xs"
                data={SEGMENTED_CONTROL_DATA}
            />

            {/* KPI Highlight Strip */}
            {selectedMetric === "All" ? (
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                    {["AVG", "OBP", "SLG", "OPS"].map((metricKey) => {
                        const config = METRIC_CONFIGS[metricKey];
                        const lowKey = metricKey.toLowerCase();
                        const change = netChanges[lowKey];
                        return (
                            <Paper
                                key={metricKey}
                                p="xs"
                                withBorder
                                radius="sm"
                                ta="center"
                            >
                                <Text size="11px" c="dimmed" fw={600}>
                                    Current {config.shortLabel}
                                </Text>
                                <Text size="md" fw={700} c={config.color}>
                                    {current?.[lowKey] || ".000"}
                                </Text>
                                <Text size="10px" c="dimmed">
                                    {change >= 0 ? "+" : ""}
                                    {change?.toFixed(3)} net
                                </Text>
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Stack gap="xs">
                    {/* Hero Row: Current Metric */}
                    <Box py="xs" ta="center">
                        <Text size="sm" fw={600}>
                            Current
                        </Text>
                        <Text
                            fw={800}
                            fz="32px"
                            lh={1.1}
                            my={2}
                            c={activeConfig?.color}
                        >
                            {activeConfig?.format(
                                current?.[selectedMetric.toLowerCase()],
                            )}
                        </Text>
                    </Box>

                    {/* Secondary Row: High, Low, Trend */}
                    {(() => {
                        const metricKey = selectedMetric.toLowerCase();
                        const change = netChanges[metricKey] ?? 0;
                        const secondaryMetrics = [
                            {
                                label: "High",
                                value: activeConfig?.format(highs[metricKey]),
                                color: "teal.4",
                            },
                            {
                                label: "Low",
                                value: activeConfig?.format(lows[metricKey]),
                                color: "red.4",
                            },
                            {
                                label: "Net Trend",
                                value: `${change >= 0 ? "+" : ""}${change.toFixed(3)}`,
                                color: change >= 0 ? "teal.4" : "red.4",
                            },
                        ];

                        return (
                            <SimpleGrid cols={3} spacing="xs">
                                {secondaryMetrics.map((item) => (
                                    <Paper
                                        key={item.label}
                                        p="xs"
                                        withBorder
                                        radius="sm"
                                        ta="center"
                                    >
                                        <Text size="11px" fw={600}>
                                            {item.label}
                                        </Text>
                                        <Text size="lg" fw={700} c={item.color}>
                                            {item.value}
                                        </Text>
                                    </Paper>
                                ))}
                            </SimpleGrid>
                        );
                    })()}
                </Stack>
            )}

            {/* Metric Explainer Card */}
            {selectedMetric !== "All" && activeConfig && (
                <Paper p="xs" radius="sm" withBorder style={CARD_SURFACE_STYLE}>
                    <Group justify="space-between" align="center" mb={4}>
                        <Group gap="xs">
                            <IconInfoCircle
                                size={15}
                                color={getMantineColorVar(activeConfig.color)}
                            />
                            <Text size="xs" fw={700}>
                                {activeConfig.label} ({activeConfig.shortLabel})
                            </Text>
                        </Group>
                        <Badge
                            size="xs"
                            variant="outline"
                            color={
                                activeConfig.badgeColor ||
                                activeConfig.color.split(".")[0]
                            }
                            style={{
                                fontWeight: 700,
                                letterSpacing: "0.2px",
                                backgroundColor:
                                    "light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.05))",
                            }}
                        >
                            {activeConfig.formula}
                        </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                        {activeConfig.summary}
                    </Text>
                </Paper>
            )}

            {/* Area Chart */}
            <Box style={{ width: "100%", minHeight: 260 }}>
                <AreaChart
                    h={260}
                    data={progression}
                    dataKey="dateLabel"
                    series={series}
                    curveType="monotone"
                    withDots
                    dotProps={{ r: 4, strokeWidth: 1 }}
                    activeDotProps={{ r: 6, strokeWidth: 2 }}
                    strokeWidth={2.5}
                    fillOpacity={0.2}
                    withLegend={false}
                    withXAxis
                    withYAxis={selectedMetric !== "All"}
                    yAxisProps={
                        selectedMetric !== "All"
                            ? {
                                  domain: yAxisDomain,
                                  tickFormatter: (val) =>
                                      activeConfig
                                          ? activeConfig.format(val)
                                          : val,
                                  width: 45,
                              }
                            : undefined
                    }
                    tooltipProps={{
                        content: ({ payload }) => (
                            <CustomProgressionTooltip
                                payload={payload}
                                selectedMetric={selectedMetric}
                            />
                        ),
                    }}
                />
            </Box>

            {/* Balanced Custom Legend for 'All' mode */}
            {selectedMetric === "All" && (
                <Group justify="center" gap="md" wrap="wrap" px="xs">
                    {ALL_SERIES.map((item) => (
                        <Group key={item.name} gap={6} align="center">
                            <Box
                                w={8}
                                h={8}
                                style={{
                                    borderRadius: "50%",
                                    backgroundColor: getMantineColorVar(
                                        item.color,
                                    ),
                                }}
                            />
                            <Text size="xs" fw={600} c="dimmed">
                                {item.label}
                            </Text>
                        </Group>
                    ))}
                </Group>
            )}

            {/* Explainer Glossary when 'All' is active */}
            {selectedMetric === "All" && (
                <Paper p="xs" radius="sm" withBorder style={CARD_SURFACE_STYLE}>
                    <Group justify="space-between" align="center" mb={6}>
                        <Group gap="xs">
                            <IconInfoCircle
                                size={15}
                                color="var(--mantine-color-lime-5)"
                            />
                            <Text size="xs" fw={700}>
                                Metric Glossary
                            </Text>
                        </Group>
                        <Text size="10px" c="dimmed">
                            Tap any tab above for isolated curves & formulas
                        </Text>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="6px">
                        {Object.entries(METRIC_CONFIGS).map(([key, config]) => (
                            <Group
                                key={key}
                                gap="xs"
                                align="flex-start"
                                wrap="nowrap"
                            >
                                <Box
                                    w={6}
                                    h={6}
                                    mt={5}
                                    style={{
                                        borderRadius: "50%",
                                        backgroundColor: getMantineColorVar(
                                            config.color,
                                        ),
                                        flexShrink: 0,
                                    }}
                                />
                                <Text size="xs" c="dimmed">
                                    <Text span fw={700} c="bright">
                                        {config.shortLabel}
                                    </Text>
                                    : {config.summary}
                                </Text>
                            </Group>
                        ))}
                    </SimpleGrid>
                </Paper>
            )}

            <Text size="xs" c="dimmed" fs="italic" ta="center">
                * Touch or hover over any point to inspect that game’s box score
                and running career/window averages.
            </Text>
        </Stack>
    );
}
