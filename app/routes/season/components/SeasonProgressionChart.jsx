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
import { AreaChart } from "@mantine/charts";
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
    `var(--mantine-color-${colorToken.replace(".", "-")})`;

const CARD_SURFACE_STYLE = {
    backgroundColor:
        "light-dark(var(--mantine-color-gray-0), rgba(255, 255, 255, 0.03))",
    borderColor:
        "light-dark(var(--mantine-color-gray-3), rgba(255, 255, 255, 0.08))",
};

const ALL_SERIES_GAME = Object.entries(METRIC_CONFIGS).map(([key, config]) => ({
    name: `game${key}`,
    label: config.shortLabel,
    color: config.color,
}));

const ALL_SERIES_CUMULATIVE = Object.entries(METRIC_CONFIGS).map(
    ([key, config]) => ({
        name: key,
        label: config.shortLabel,
        color: config.color,
    }),
);

const VIEW_MODE_OPTIONS = [
    { label: "Per Game", value: "game" },
    { label: "Cumulative", value: "cumulative" },
];

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
    viewMode = "game",
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
                    {viewMode === "game"
                        ? `Game Hitting Rates (${gameStats.line})`
                        : `Cumulative to Date (${cumulative.hits}/${cumulative.ab})`}
                </Text>

                {selectedMetric === "All" ? (
                    <SimpleGrid cols={2} spacing="4px">
                        {Object.entries(METRIC_CONFIGS).map(([key, config]) => {
                            const lowKey = key.toLowerCase();
                            const val =
                                viewMode === "game"
                                    ? singleGame?.[lowKey]
                                    : cumulative?.[lowKey];
                            const diffFromSeason =
                                seasonTotals && singleGame?.raw
                                    ? singleGame.raw[lowKey] -
                                      seasonTotals.raw[lowKey]
                                    : 0;
                            const delta =
                                viewMode === "game"
                                    ? diffFromSeason
                                    : deltas?.[lowKey];

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
                                {viewMode === "game"
                                    ? "Game Output"
                                    : "Cumulative"}
                            </Text>
                        </Stack>
                        <Stack gap={0} align="flex-end">
                            <Text size="md" fw={700}>
                                {viewMode === "game"
                                    ? singleGame?.[selectedMetric.toLowerCase()]
                                    : cumulative?.[
                                          selectedMetric.toLowerCase()
                                      ]}
                            </Text>
                            {(() => {
                                const lowKey = selectedMetric.toLowerCase();
                                if (viewMode === "game") {
                                    const diff =
                                        seasonTotals && singleGame?.raw
                                            ? singleGame.raw[lowKey] -
                                              seasonTotals.raw[lowKey]
                                            : 0;
                                    return renderDelta(diff, "vs Avg");
                                }
                                return renderDelta(deltas?.[lowKey]);
                            })()}
                        </Stack>
                    </Group>
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

    return (
        <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={fillColor}
            stroke="#1F2937"
            strokeWidth={1.5}
            style={{
                filter:
                    isWin || isLoss
                        ? "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45))"
                        : undefined,
            }}
        />
    );
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
        ? "#20c997"
        : isLoss
          ? "#fa5252"
          : stroke || "#868e96";

    return (
        <g>
            <circle cx={cx} cy={cy} r={8.5} fill={fillColor} opacity={0.3} />
            <circle
                cx={cx}
                cy={cy}
                r={6}
                fill={fillColor}
                stroke="#ffffff"
                strokeWidth={2}
            />
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
    const [viewMode, setViewMode] = useState("game");
    const [selectedMetric, setSelectedMetric] = useState("All");

    /**
     * Handles switching between Per Game and Cumulative view modes.
     *
     * @param {string} val - Next view mode ('game' | 'cumulative')
     */
    const handleViewModeChange = (val) => {
        setViewMode(val);
        trackEvent("season-trends-mode-changed", {
            seasonId,
            viewMode: val,
        });
    };

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
            viewMode,
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

    // Series definition based on view mode and selected metric
    const series = useMemo(() => {
        const isGameMode = viewMode === "game";
        if (selectedMetric === "All") {
            return isGameMode ? ALL_SERIES_GAME : ALL_SERIES_CUMULATIVE;
        }
        const config = METRIC_CONFIGS[selectedMetric];
        const seriesName = isGameMode
            ? `game${selectedMetric}`
            : selectedMetric;
        return config
            ? [
                  {
                      name: seriesName,
                      label: config.label,
                      color: config.color,
                  },
              ]
            : isGameMode
              ? ALL_SERIES_GAME
              : ALL_SERIES_CUMULATIVE;
    }, [selectedMetric, viewMode]);

    // Calculate dynamic Y-axis domain when an individual metric is chosen
    const yAxisDomain = useMemo(() => {
        if (selectedMetric === "All" || !hasEnoughData) {
            return [0, "auto"];
        }

        const dataKey =
            viewMode === "game" ? `game${selectedMetric}` : selectedMetric;
        const values = progression
            .map((p) => p[dataKey])
            .filter((v) => typeof v === "number" && !isNaN(v));

        if (
            viewMode === "game" &&
            summary?.seasonTotals?.raw?.[selectedMetric.toLowerCase()] !==
                undefined
        ) {
            values.push(summary.seasonTotals.raw[selectedMetric.toLowerCase()]);
        }

        if (!values.length) return [0, 1];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const padding = range === 0 ? 0.05 : Math.max(0.02, range * 0.2);

        const domainMin = Math.max(0, parseFloat((min - padding).toFixed(3)));
        const domainMax = parseFloat((max + padding).toFixed(3));

        return [domainMin, domainMax];
    }, [selectedMetric, viewMode, progression, hasEnoughData, summary]);

    // Season benchmark reference line for Single Game mode
    const referenceLines = useMemo(() => {
        if (
            viewMode !== "game" ||
            selectedMetric === "All" ||
            !summary?.seasonTotals
        ) {
            return [];
        }
        const lowKey = selectedMetric.toLowerCase();
        const avgVal = summary.seasonTotals.raw?.[lowKey];
        if (typeof avgVal !== "number" || isNaN(avgVal)) return [];

        return [
            {
                y: avgVal,
                label: `Season ${activeConfig?.shortLabel}: ${summary.seasonTotals[lowKey]}`,
                color: "gray.5",
                strokeDasharray: "4 4",
                labelPosition: "insideTopRight",
            },
        ];
    }, [viewMode, selectedMetric, summary, activeConfig]);

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

    const {
        current,
        highs,
        lows,
        gameHighs,
        gameLows,
        netChanges,
        record,
        seasonTotals,
    } = summary;

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

                {/* View Mode Toggle: Per Game Output vs Cumulative Progression */}
                <SegmentedControl
                    value={viewMode}
                    onChange={handleViewModeChange}
                    color={primaryColor}
                    size="xs"
                    fullWidth
                    data={VIEW_MODE_OPTIONS}
                />

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
                            const isGame = viewMode === "game";
                            const value = isGame
                                ? seasonTotals?.[lowKey] ||
                                  current?.[lowKey] ||
                                  ".000"
                                : current?.[lowKey] || ".000";
                            const subText = isGame
                                ? `Best: ${gameHighs?.[lowKey] !== undefined ? config.format(gameHighs[lowKey]) : ".000"}`
                                : `${change >= 0 ? "+" : ""}${change?.toFixed(3)} net`;

                            return (
                                <Paper
                                    key={metricKey}
                                    p="xs"
                                    withBorder
                                    radius="sm"
                                    ta="center"
                                >
                                    <Text size="11px" c="dimmed" fw={600}>
                                        {isGame ? "Season" : "Team"}{" "}
                                        {config.shortLabel}
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
                                {viewMode === "game"
                                    ? "Season"
                                    : "Current Team"}{" "}
                                {activeConfig?.label}
                            </Text>
                            <Text
                                fw={800}
                                fz="32px"
                                lh={1.1}
                                my={2}
                                c={activeConfig?.color}
                            >
                                {viewMode === "game"
                                    ? seasonTotals?.[
                                          selectedMetric.toLowerCase()
                                      ] ||
                                      activeConfig?.format(
                                          current?.[
                                              selectedMetric.toLowerCase()
                                          ],
                                      )
                                    : activeConfig?.format(
                                          current?.[
                                              selectedMetric.toLowerCase()
                                          ],
                                      )}
                            </Text>
                        </Box>

                        {/* Secondary Row: High, Low, Trend / Best Game, Lowest Game, Latest Game */}
                        {(() => {
                            const metricKey = selectedMetric.toLowerCase();
                            const isGame = viewMode === "game";

                            const secondaryMetrics = isGame
                                ? [
                                      {
                                          label: "Best Game",
                                          value:
                                              gameHighs?.[metricKey] !==
                                              undefined
                                                  ? activeConfig?.format(
                                                        gameHighs[metricKey],
                                                    )
                                                  : "-",
                                          color: "teal.4",
                                      },
                                      {
                                          label: "Lowest Game",
                                          value:
                                              gameLows?.[metricKey] !==
                                              undefined
                                                  ? activeConfig?.format(
                                                        gameLows[metricKey],
                                                    )
                                                  : "-",
                                          color: "red.4",
                                      },
                                      {
                                          label: "Latest Game",
                                          value:
                                              progression[
                                                  progression.length - 1
                                              ]?.singleGame?.[metricKey] || "-",
                                          color:
                                              activeConfig?.color || "lime.4",
                                      },
                                  ]
                                : [
                                      {
                                          label: "High",
                                          value: activeConfig?.format(
                                              highs[metricKey],
                                          ),
                                          color: "teal.4",
                                      },
                                      {
                                          label: "Low",
                                          value: activeConfig?.format(
                                              lows[metricKey],
                                          ),
                                          color: "red.4",
                                      },
                                      {
                                          label: "Net Trend",
                                          value: `${(netChanges[metricKey] ?? 0) >= 0 ? "+" : ""}${(netChanges[metricKey] ?? 0).toFixed(3)}`,
                                          color:
                                              (netChanges[metricKey] ?? 0) >= 0
                                                  ? "teal.4"
                                                  : "red.4",
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

                {/* Area Chart with Win/Loss outcome dot indicators */}
                <Box
                    style={{
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        minHeight: 260,
                        overflow: "hidden",
                    }}
                >
                    <style>{`
                        .mantine-AreaChart-root {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-AreaChart-container {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-AreaChart-container > div {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-AreaChart-root .recharts-responsive-container {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                        .mantine-AreaChart-root .recharts-wrapper {
                            width: 100% !important;
                            max-width: 100% !important;
                            left: 0 !important;
                            right: 0 !important;
                            margin: 0 auto !important;
                        }
                        .mantine-AreaChart-root .recharts-surface {
                            width: 100% !important;
                            max-width: 100% !important;
                        }
                    `}</style>
                    <AreaChart
                        h={260}
                        w="100%"
                        data={progression}
                        dataKey="dateLabel"
                        series={series}
                        curveType="monotone"
                        gridAxis="x"
                        withDots={false}
                        areaProps={{
                            dot: (dotProps) => <OutcomeDot {...dotProps} />,
                            activeDot: (activeProps) => (
                                <ActiveOutcomeDot {...activeProps} />
                            ),
                        }}
                        strokeWidth={2.5}
                        fillOpacity={0.2}
                        withLegend={false}
                        withXAxis
                        withYAxis={selectedMetric !== "All"}
                        referenceLines={referenceLines}
                        areaChartProps={{
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
                                    viewMode={viewMode}
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
                        {(viewMode === "game"
                            ? ALL_SERIES_GAME
                            : ALL_SERIES_CUMULATIVE
                        ).map((item) => (
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
                    {viewMode === "game"
                        ? "* Green dots indicate Wins, Red dots indicate Losses. Touch or hover over any point to inspect single-game box output, outcome, and variance vs season average."
                        : "* Green dots indicate Wins, Red dots indicate Losses. Touch or hover over any point to inspect cumulative team rates, outcome, and running season progression."}
                </Text>
            </Stack>
        </Card>
    );
}
