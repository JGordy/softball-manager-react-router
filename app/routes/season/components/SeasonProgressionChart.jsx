import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Card,
    Group,
    Paper,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
    Badge,
} from "@mantine/core";
import { CompositeChart } from "@mantine/charts";
import {
    IconArrowUpRight,
    IconArrowDownRight,
    IconMinus,
    IconChartLine,
    IconInfoCircle,
    IconTrophy,
} from "@tabler/icons-react";

import { BATTING_METRIC_CONFIGS } from "@/constants/metrics";
import { calculateTeamProgression } from "@/utils/stats";
import { trackEvent } from "@/utils/analytics";

const METRIC_CONFIGS = BATTING_METRIC_CONFIGS;

const getMantineColorVar = (colorToken) =>
    colorToken?.startsWith("var(")
        ? colorToken
        : `var(--mantine-color-${colorToken.replace(".", "-")})`;

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
    type: "line",
}));

const SEGMENTED_CONTROL_DATA = [
    { label: "All", value: "All" },
    ...Object.keys(METRIC_CONFIGS).map((key) => ({
        label: key,
        value: key,
    })),
];

/**
 * Custom interactive tooltip themed for both dark and light modes,
 * featuring prominent Win/Loss outcome badges.
 */
function CustomTeamProgressionTooltip({
    payload,
    selectedMetric,
    seasonTotals = null,
}) {
    if (!payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    const {
        dateLabel,
        fullDate,
        opponent,
        outcome,
        scoreText,
        gameStats,
        singleGame,
        cumulative,
        deltas,
    } = dataPoint;

    const renderDelta = (delta, label = "") => {
        if (delta === 0 || delta === undefined) {
            return (
                <Group gap={2}>
                    <IconMinus size={12} color="gray" />
                    <Text size="xs" c="dimmed">
                        {label ? `${label} 0.000` : "0.000"}
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
                    {label ? `${label} ` : ""}
                    {sign}
                    {delta.toFixed(3)}
                </Text>
            </Group>
        );
    };

    const outcomeColor =
        outcome === "W" ? "teal" : outcome === "L" ? "red" : "gray";

    return (
        <Paper
            p="xs"
            withBorder
            shadow="xl"
            radius="md"
            style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-card)",
                minWidth: 230,
                maxWidth: 300,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            }}
        >
            {/* Header: Date, Opponent & W/L Outcome Badge */}
            <Group justify="space-between" align="flex-start" gap="xs">
                <Stack gap={1}>
                    <Group gap={6} align="center">
                        <Text size="xs" fw={700} c="bright">
                            vs {opponent}
                        </Text>
                        {outcome && (
                            <Badge
                                size="xs"
                                variant="filled"
                                color={outcomeColor}
                                fw={700}
                            >
                                {scoreText || outcome}
                            </Badge>
                        )}
                    </Group>
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

            {/* Rates Section */}
            <Stack gap={4} mt="xs">
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                    Averages to Date ({cumulative.hits}/{cumulative.ab})
                </Text>

                {selectedMetric === "All" ? (
                    <SimpleGrid cols={2} spacing="4px">
                        {Object.entries(METRIC_CONFIGS).map(([key, config]) => {
                            const lowKey = key.toLowerCase();
                            const val = cumulative?.[lowKey];
                            const delta = deltas?.[lowKey];

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
                                            {val || ".000"}
                                        </Text>
                                        {renderDelta(delta)}
                                    </Group>
                                </Group>
                            );
                        })}
                    </SimpleGrid>
                ) : (
                    <Stack gap={6}>
                        <Group justify="space-between" align="center">
                            <Stack gap={0}>
                                <Text size="xs" fw={600} c="dimmed">
                                    Game{" "}
                                    {METRIC_CONFIGS[selectedMetric]?.shortLabel}
                                </Text>
                                <Text size="10px" c="dimmed">
                                    This Game
                                </Text>
                            </Stack>
                            <Stack gap={0} align="flex-end">
                                <Text size="sm" fw={700}>
                                    {singleGame?.[
                                        selectedMetric.toLowerCase()
                                    ] ||
                                        (dataPoint[`game${selectedMetric}`] !==
                                        undefined
                                            ? METRIC_CONFIGS[
                                                  selectedMetric
                                              ]?.format(
                                                  dataPoint[
                                                      `game${selectedMetric}`
                                                  ],
                                              )
                                            : "—")}
                                </Text>
                                {(() => {
                                    const lowKey = selectedMetric.toLowerCase();
                                    const diff =
                                        seasonTotals?.raw &&
                                        singleGame?.raw &&
                                        singleGame.raw[lowKey] !== undefined &&
                                        seasonTotals.raw[lowKey] !== undefined
                                            ? singleGame.raw[lowKey] -
                                              seasonTotals.raw[lowKey]
                                            : 0;
                                    return renderDelta(diff, "vs Avg");
                                })()}
                            </Stack>
                        </Group>
                        <Group justify="space-between" align="center">
                            <Stack gap={0}>
                                <Text
                                    size="xs"
                                    fw={700}
                                    c={METRIC_CONFIGS[selectedMetric]?.color}
                                >
                                    Running{" "}
                                    {METRIC_CONFIGS[selectedMetric]?.shortLabel}
                                </Text>
                                <Text size="10px" c="dimmed">
                                    Cumulative
                                </Text>
                            </Stack>
                            <Stack gap={0} align="flex-end">
                                <Text size="md" fw={700}>
                                    {cumulative?.[selectedMetric.toLowerCase()]}
                                </Text>
                                {renderDelta(
                                    deltas?.[selectedMetric.toLowerCase()],
                                )}
                            </Stack>
                        </Group>
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}

/**
 * Custom dot component that renders distinct Win (green/teal) and Loss (red)
 * dots on the trendline so game outcomes are directly readable on the curve.
 */
function OutcomeDot({ cx, cy, payload, stroke }) {
    if (cx == null || cy == null || isNaN(cx) || isNaN(cy)) return null;

    const outcome = payload?.outcome;
    const isWin = outcome === "W";
    const isLoss = outcome === "L";

    const fillColor = isWin
        ? "#20c997" // teal-5 (Win)
        : isLoss
          ? "#fa5252" // red-5 (Loss)
          : stroke || "#868e96";

    return <circle cx={cx} cy={cy} r={4.5} fill={fillColor} />;
}

/**
 * Custom active dot component when hovering over a game data point.
 */
function ActiveOutcomeDot({ cx, cy, payload, stroke }) {
    if (cx == null || cy == null || isNaN(cx) || isNaN(cy)) return null;

    const outcome = payload?.outcome;
    const isWin = outcome === "W";
    const isLoss = outcome === "L";

    const fillColor = isWin
        ? "#20c997" // teal-5 (Win)
        : isLoss
          ? "#fa5252" // red-5 (Loss)
          : stroke || "#868e96";

    return (
        <g>
            <circle cx={cx} cy={cy} r={8.5} fill={fillColor} opacity={0.25} />
            <circle cx={cx} cy={cy} r={6} fill={fillColor} />
        </g>
    );
}

/**
 * Interactive Area Chart component for tracking team batting trends across a season.
 * Surfaces running team rates (AVG, OBP, SLG, OPS, ISO) with game-by-game Win/Loss outcome indicators.
 *
 * @param {Object} props
 * @param {string} [props.seasonId] - Season ID
 * @param {Array} props.games - Season games
 * @param {Array} props.logs - Season game logs
 * @param {Array} [props.players=[]] - Team roster players
 * @param {string} [props.primaryColor="lime"] - Primary color accent
 * @param {boolean} [props.isActive=true] - Whether the slide is currently active
 * @returns {JSX.Element} Rendered season progression chart card
 */
export default function SeasonProgressionChart({
    seasonId,
    games = [],
    logs = [],
    players = [],
    primaryColor = "lime",
    isActive = true,
}) {
    const [selectedMetric, setSelectedMetric] = useState("All");

    /**
     * Handles switching the selected metric filter.
     *
     * @param {string} val - Next selected metric (e.g. 'All', 'AVG', 'OBP')
     */
    const handleMetricChange = (val) => {
        setSelectedMetric(val);
        trackEvent("season-trends-metric-changed", {
            seasonId,
            metric: val,
        });
    };

    // Trigger ResizeObserver / Recharts redraw whenever the slide becomes active in the carousel
    useEffect(() => {
        if (isActive) {
            const timer = setTimeout(() => {
                window.dispatchEvent(new Event("resize"));
            }, 60);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    // Compute game-by-game team progression data
    const { progression, summary } = useMemo(() => {
        return calculateTeamProgression({
            logs,
            games,
            players,
        });
    }, [logs, games, players]);

    const hasEnoughData = progression.length >= 2;

    const activeConfig = METRIC_CONFIGS[selectedMetric];

    // Series definition based on selected metric: composite bar + line for single metric, lines only for All
    const series = useMemo(() => {
        if (selectedMetric === "All") {
            return ALL_SERIES;
        }
        return activeConfig
            ? [
                  {
                      name: `game${selectedMetric}`,
                      label: `Game ${activeConfig.shortLabel}`,
                      type: "bar",
                      color: "var(--chart-bar-color)",
                  },
                  {
                      name: selectedMetric,
                      label: `Running ${activeConfig.shortLabel}`,
                      type: "line",
                      color: activeConfig.color,
                  },
              ]
            : ALL_SERIES;
    }, [selectedMetric, activeConfig]);

    // Calculate dynamic Y-axis domain when an individual metric is chosen
    const yAxisDomain = useMemo(() => {
        if (selectedMetric === "All" || !hasEnoughData) {
            return [0, "auto"];
        }

        const lineValues = progression
            .map((p) => p[selectedMetric])
            .filter((v) => typeof v === "number" && !isNaN(v));

        const barValues = progression
            .map((p) => p[`game${selectedMetric}`])
            .filter((v) => typeof v === "number" && !isNaN(v));

        const allValues = [...lineValues, ...barValues];
        if (!allValues.length) return [0, 1];

        const max = Math.max(...allValues);
        const padding = max === 0 ? 0.1 : Math.max(0.05, max * 0.1);
        let domainMax = parseFloat((max + padding).toFixed(3));

        if (activeConfig?.max != null) {
            domainMax = Math.min(activeConfig.max, domainMax);
        }

        return [0, domainMax];
    }, [selectedMetric, progression, hasEnoughData, activeConfig]);

    if (!hasEnoughData) {
        return (
            <Card withBorder padding="lg" radius="md" ta="center">
                <Stack align="center" gap="sm" py="xl">
                    <IconChartLine
                        size={40}
                        color="var(--mantine-color-dimmed)"
                    />
                    <Text fw={600} size="md">
                        Not Enough Season Game Data
                    </Text>
                    <Text size="sm" c="dimmed" maw={360}>
                        At least 2 logged games with hitting stats are required
                        to plot team performance trends over time. As games are
                        scored, cumulative trendlines and outcomes will appear
                        here.
                    </Text>
                </Stack>
            </Card>
        );
    }

    const { current, gameHighs, gameLows, netChanges, record } = summary;

    return (
        <Card
            withBorder
            padding="lg"
            radius="md"
            style={{ overflow: "hidden", width: "100%" }}
        >
            <Stack gap="md" w="100%" style={{ minWidth: 0 }}>
                {/* Header: Record badge & Section Label */}
                {record && (
                    <Group justify="space-between" align="center">
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                            Performance Trends
                        </Text>
                        <Badge
                            size="sm"
                            variant="light"
                            color="lime"
                            leftSection={<IconTrophy size={13} />}
                        >
                            Record: {record.wins}-{record.losses}-{record.ties}
                        </Badge>
                    </Group>
                )}

                {/* Metric Selector Controls filling full card width */}
                <SegmentedControl
                    value={selectedMetric}
                    onChange={handleMetricChange}
                    color={primaryColor}
                    size="xs"
                    fullWidth
                    data={SEGMENTED_CONTROL_DATA}
                />

                {/* KPI Highlight Strip */}
                {selectedMetric === "All" ? (
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                        {["AVG", "OBP", "SLG", "OPS"].map((metricKey) => {
                            const config = METRIC_CONFIGS[metricKey];
                            const lowKey = metricKey.toLowerCase();
                            const change = netChanges[lowKey];
                            const value = current?.[lowKey] || ".000";
                            const subText = `${change >= 0 ? "+" : ""}${change?.toFixed(3)} net`;

                            return (
                                <Paper
                                    key={metricKey}
                                    p="xs"
                                    withBorder
                                    radius="sm"
                                    ta="center"
                                >
                                    <Text size="11px" c="dimmed" fw={600}>
                                        Team {config.shortLabel}
                                    </Text>
                                    <Text size="md" fw={700} c={config.color}>
                                        {value}
                                    </Text>
                                    <Text size="10px" c="dimmed">
                                        {subText}
                                    </Text>
                                </Paper>
                            );
                        })}
                    </SimpleGrid>
                ) : (
                    <Stack gap="xs">
                        {/* Hero Row: Current Team Metric */}
                        <Box py="xs" ta="center">
                            <Text size="sm" fw={600}>
                                Current Team {activeConfig?.label}
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

                        {/* Secondary Row: Best Game, Lowest Game, Net Trend */}
                        {(() => {
                            const metricKey = selectedMetric.toLowerCase();
                            const change = netChanges[metricKey] ?? 0;
                            const secondaryMetrics = [
                                {
                                    label: "Best Game",
                                    value:
                                        gameHighs?.[metricKey] !== undefined
                                            ? activeConfig?.format(
                                                  gameHighs[metricKey],
                                              )
                                            : "-",
                                    color: "teal.4",
                                },
                                {
                                    label: "Lowest Game",
                                    value:
                                        gameLows?.[metricKey] !== undefined
                                            ? activeConfig?.format(
                                                  gameLows[metricKey],
                                              )
                                            : "-",
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
                                            <Text
                                                size="lg"
                                                fw={700}
                                                c={item.color}
                                            >
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
                    <Paper
                        p="xs"
                        radius="sm"
                        withBorder
                        style={CARD_SURFACE_STYLE}
                    >
                        <Group justify="space-between" align="center" mb={4}>
                            <Group gap="xs">
                                <IconInfoCircle
                                    size={15}
                                    color={getMantineColorVar(
                                        activeConfig.color,
                                    )}
                                />
                                <Text size="xs" fw={700}>
                                    {activeConfig.label} (
                                    {activeConfig.shortLabel})
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

                {/* Composite Chart with Win/Loss outcome dot indicators on the line */}
                <Box
                    style={{
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        minHeight: 260,
                        overflow: "hidden",
                        "--chart-bar-color":
                            "light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.14))",
                    }}
                >
                    <style>{`
                        .mantine-CompositeChart-root {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-CompositeChart-container {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-CompositeChart-container > div {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-CompositeChart-root .recharts-responsive-container {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-CompositeChart-root .recharts-wrapper {
                            width: 100% !important;
                            max-width: 100% !important;
                            left: 0 !important;
                            right: 0 !important;
                            margin: 0 auto !important;
                        }
                        .mantine-CompositeChart-root .recharts-surface {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                    `}</style>
                    <CompositeChart
                        h={260}
                        w="100%"
                        data={progression}
                        dataKey="dateLabel"
                        series={series}
                        curveType="monotone"
                        gridAxis="x"
                        maxBarWidth={14}
                        barProps={{ radius: [4, 4, 0, 0] }}
                        withDots={false}
                        lineProps={{
                            dot: (dotProps) => <OutcomeDot {...dotProps} />,
                            activeDot: (activeProps) => (
                                <ActiveOutcomeDot {...activeProps} />
                            ),
                            strokeWidth: 2.5,
                        }}
                        withLegend={false}
                        withXAxis
                        withYAxis={selectedMetric !== "All"}
                        composedChartProps={{
                            margin: { top: 10, right: 10, left: 10, bottom: 0 },
                        }}
                        xAxisProps={{
                            padding: { left: 10, right: 10 },
                        }}
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
                                : { width: 0 }
                        }
                        tooltipProps={{
                            content: ({ payload }) => (
                                <CustomTeamProgressionTooltip
                                    payload={payload}
                                    selectedMetric={selectedMetric}
                                    seasonTotals={summary?.seasonTotals}
                                />
                            ),
                        }}
                    />
                </Box>

                {/* Balanced Custom Legend for 'All' mode */}
                {selectedMetric === "All" && (
                    <Group
                        justify="center"
                        gap="md"
                        wrap="wrap"
                        px="xs"
                        mt="xs"
                    >
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
                    <Paper
                        p="xs"
                        radius="sm"
                        withBorder
                        style={CARD_SURFACE_STYLE}
                    >
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
                            {Object.entries(METRIC_CONFIGS).map(
                                ([key, config]) => (
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
                                                backgroundColor:
                                                    getMantineColorVar(
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
                                ),
                            )}
                        </SimpleGrid>
                    </Paper>
                )}

                <Text size="xs" c="dimmed" fs="italic" ta="center">
                    * Green dots indicate Wins, Red dots indicate Losses. Touch
                    or hover over any point to inspect single-game output (bars)
                    alongside running trajectory (line).
                </Text>
            </Stack>
        </Card>
    );
}
