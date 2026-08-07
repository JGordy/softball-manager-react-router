import { useMemo, useState, useCallback } from "react";

import {
    Badge,
    Box,
    Button,
    Card,
    Chip,
    Flex,
    Group,
    Image,
    Select,
    Stack,
    Text,
    Tooltip,
    ColorSwatch,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFilter } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer/DrawerContainer";
import images from "@/constants/images";
import { ORIGIN_X, ORIGIN_Y } from "@/constants/fieldMapping";
import {
    EVENT_TYPE_MAP,
    getUILabel,
    RESULT_COLORS,
    HITS,
    OUTS,
} from "@/constants/scoring";

import styles from "./ContactSprayChart.module.css";

const OVERALL = "OVERALL";
const BATS_LEFT = "LEFT";
const BATS_RIGHT = "RIGHT";

const LEGEND_ITEMS = [
    { label: "Single", color: RESULT_COLORS.single },
    { label: "Double", color: RESULT_COLORS.double },
    { label: "Triple", color: RESULT_COLORS.triple },
    { label: "Home Run", color: RESULT_COLORS.homerun },
    { label: "Out", color: RESULT_COLORS.out },
    { label: "Error / FC", color: RESULT_COLORS.error },
];

const CATEGORIES_DATA = [
    { label: "All", value: "ALL" },
    { label: "All Hits", value: "HITS" },
    { label: "All Outs", value: "OUTS" },
    ...HITS.map((h) => ({ label: getUILabel(h), value: h })),
    ...OUTS.filter((o) => o !== "out" && o !== "strikeout").map((o) => ({
        label: getUILabel(o),
        value: o,
    })),
    { label: getUILabel("fielders_choice"), value: "fielders_choice" },
    { label: getUILabel("error"), value: "error" },
    { label: getUILabel("sacrifice_fly"), value: "sacrifice_fly" },
];

/**
 * Renders an interactive contact spray chart overlayed on a field image.
 *
 * The chart plots batted-ball events using their normalized field coordinates
 * (`hitX`, `hitY`) and allows filtering by batting side, result category, and
 * general hit location. Each point is colored and labeled based on the
 * normalized event type.
 *
 * @param {Object} props - Component props.
 * @param {Object[]} [props.hits=[]] - Array of batted-ball events to display.
 * @param {number} props.hits[].hitX - Normalized x-coordinate of contact on the field,
 *     relative to the origin defined by {@link ORIGIN_X}.
 * @param {number} props.hits[].hitY - Normalized y-coordinate of contact on the field,
 *     relative to the origin defined by {@link ORIGIN_Y}.
 * @param {string} [props.hits[].eventType] - Raw event type key for the play
 *     (e.g., "single", "flyout"); may be mapped via {@link EVENT_TYPE_MAP}.
 * @param {string} [props.hits[].result] - Fallback result key when `eventType`
 *     is not provided.
 * @param {string} [props.hits[].battingSide] - Batting side for the event
 *     ("LEFT", "RIGHT", or similar), used for side-based filtering.
 * @param {string} [props.hits[].hitLocation] - Textual description of where the
 *     ball was hit (e.g., "left field", "center field"); used for location filters.
 * @param {string} [props.hits[].direction] - Optional alternative to `hitLocation`
 *     describing the hit direction (e.g., "right field line").
 * @param {"flex"|"stacked"} [props.layout="flex"] - Layout mode for the component.
 *     "flex" displays the chart and legend side-by-side on desktop.
 *     "stacked" forces them to be vertical (column) regardless of viewport.
 *
 * @returns {JSX.Element} A card containing the filter controls, field image, and
 * plotted contact points with tooltips for each batted-ball event.
 */
export default function ContactSprayChart({
    hits = [],
    showBattingSide = true,
    batters = [],
    layout = "flex",
    games = [],
}) {
    const [battingSide, setBattingSide] = useState(OVERALL);
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [locationFilter, setLocationFilter] = useState("ALL");
    const [playerFilter, setPlayerFilter] = useState("ALL");
    const [gameFilter, setGameFilter] = useState("ALL");
    const [opened, { toggle }] = useDisclosure(false);

    const activeFilterCount =
        (playerFilter !== "ALL" ? 1 : 0) +
        (categoryFilter !== "ALL" ? 1 : 0) +
        (locationFilter !== "ALL" ? 1 : 0) +
        (gameFilter !== "ALL" ? 1 : 0) +
        (battingSide !== OVERALL ? 1 : 0);

    const resetFilters = useCallback(() => {
        setCategoryFilter("ALL");
        setLocationFilter("ALL");
        setBattingSide(OVERALL);
        setPlayerFilter("ALL");
        setGameFilter("ALL");
    }, []);

    const filteredHits = useMemo(() => {
        return hits
            .map((hit) => {
                // Pre-calculate normalized key, color and label to avoid duplication
                const eventType = hit.eventType || hit.result;
                const normalizedKey = EVENT_TYPE_MAP[eventType] || eventType;
                const color = RESULT_COLORS[normalizedKey] || RESULT_COLORS.out;
                const label = getUILabel(normalizedKey);

                return {
                    ...hit,
                    normalizedKey,
                    color,
                    label,
                };
            })
            .filter((hit) => {
                // Only include items with coordinates for spray chart
                if (hit.hitX == null || hit.hitY == null) return false;

                // Player filter
                if (playerFilter !== "ALL" && hit.playerId !== playerFilter) {
                    return false;
                }

                // Batting side filter
                const sideMatch =
                    !showBattingSide ||
                    battingSide === OVERALL ||
                    hit.battingSide?.toUpperCase() === battingSide;

                if (!sideMatch) return false;

                // Game filter
                if (gameFilter !== "ALL" && hit.gameId !== gameFilter) {
                    return false;
                }

                // Category filter
                if (categoryFilter === "HITS") {
                    if (!HITS.includes(hit.normalizedKey)) return false;
                } else if (categoryFilter === "OUTS") {
                    if (!OUTS.includes(hit.normalizedKey)) return false;
                } else if (categoryFilter !== "ALL") {
                    if (hit.normalizedKey !== categoryFilter) return false;
                }

                // Location filter
                const loc = (
                    hit.hitLocation ||
                    hit.direction ||
                    ""
                ).toLowerCase();
                if (locationFilter !== "ALL") {
                    if (locationFilter === "LF") {
                        if (!loc.includes("left")) return false;
                    } else if (locationFilter === "CF") {
                        if (!loc.includes("center")) return false;
                    } else if (locationFilter === "RF") {
                        if (!loc.includes("right")) return false;
                    } else if (locationFilter === "IF") {
                        const isInfield =
                            loc.includes("base") ||
                            loc.includes("short") ||
                            loc.includes("middle") ||
                            loc.includes("pitcher") ||
                            loc.includes("catcher") ||
                            loc.includes("front");
                        if (!isInfield) return false;
                    }
                }

                return true;
            });
    }, [
        hits,
        battingSide,
        categoryFilter,
        locationFilter,
        playerFilter,
        gameFilter,
        showBattingSide,
    ]);

    const filteredStats = useMemo(() => {
        const total = filteredHits.length;
        const hitsCount = filteredHits.filter((h) =>
            HITS.includes(h.normalizedKey),
        ).length;
        const gameIds = new Set(
            filteredHits.map((h) => h.gameId).filter(Boolean),
        );
        const totalGameIds = new Set(hits.map((h) => h.gameId).filter(Boolean));
        const avg = total > 0 ? (hitsCount / total).toFixed(3) : ".000";
        return {
            total,
            hitsCount,
            avg: avg.startsWith("0") ? avg.substring(1) : avg, // format .333 instead of 0.333
            gameCount: gameIds.size,
            totalGames: totalGameIds.size,
        };
    }, [filteredHits, hits]);

    return (
        <Box>
            <Stack gap="xs" mb="md">
                <Group justify="space-between" align="center">
                    {showBattingSide ? (
                        <Chip.Group
                            value={battingSide}
                            onChange={setBattingSide}
                        >
                            <Group gap="5px">
                                <Chip
                                    value={OVERALL}
                                    variant="light"
                                    color="lime"
                                >
                                    All
                                </Chip>
                                <Chip
                                    value={BATS_RIGHT}
                                    variant="light"
                                    color="lime"
                                >
                                    Right
                                </Chip>
                                <Chip
                                    value={BATS_LEFT}
                                    variant="light"
                                    color="lime"
                                >
                                    Left
                                </Chip>
                            </Group>
                        </Chip.Group>
                    ) : (
                        <Text fw={700} size="sm">
                            Spray Chart
                        </Text>
                    )}

                    <Button
                        variant={activeFilterCount > 0 ? "light" : "subtle"}
                        color={activeFilterCount > 0 ? "lime" : "gray"}
                        size="sm"
                        leftSection={<IconFilter size={14} />}
                        rightSection={
                            activeFilterCount > 0 && (
                                <Badge
                                    size="xs"
                                    color="lime"
                                    variant="filled"
                                    aria-label={`Filters active: ${activeFilterCount}`}
                                    aria-live="polite"
                                >
                                    {activeFilterCount}
                                </Badge>
                            )
                        }
                        onClick={toggle}
                    >
                        Filters
                    </Button>
                </Group>

                <DrawerContainer
                    opened={opened}
                    onClose={toggle}
                    size="auto"
                    title={
                        <Group gap="xs">
                            <IconFilter size={18} />
                            <Text fw={700}>Filter Spray Chart</Text>
                        </Group>
                    }
                >
                    <Stack gap="md" py="xs">
                        {showBattingSide && (
                            <Box>
                                <Text
                                    size="xs"
                                    fw={700}
                                    c="dimmed"
                                    mb="xs"
                                    tt="uppercase"
                                >
                                    Batting Side
                                </Text>
                                <Chip.Group
                                    value={battingSide}
                                    onChange={setBattingSide}
                                >
                                    <Group gap="xs">
                                        <Chip
                                            value={OVERALL}
                                            variant="light"
                                            color="lime"
                                        >
                                            All
                                        </Chip>
                                        <Chip
                                            value={BATS_RIGHT}
                                            variant="light"
                                            color="lime"
                                        >
                                            Right
                                        </Chip>
                                        <Chip
                                            value={BATS_LEFT}
                                            variant="light"
                                            color="lime"
                                        >
                                            Left
                                        </Chip>
                                    </Group>
                                </Chip.Group>
                            </Box>
                        )}

                        {batters.length > 0 && (
                            <Select
                                label="Batter"
                                placeholder="All Batters"
                                data={[
                                    { label: "All", value: "ALL" },
                                    ...batters,
                                ]}
                                value={playerFilter}
                                onChange={setPlayerFilter}
                                size="md"
                                comboboxProps={{
                                    zIndex: 6000,
                                    withinPortal: true,
                                }}
                            />
                        )}

                        <Select
                            label="Result / Event Type"
                            placeholder="All Results"
                            data={CATEGORIES_DATA}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            size="md"
                            comboboxProps={{
                                zIndex: 6000,
                                withinPortal: true,
                            }}
                        />

                        <Select
                            label="Field Location"
                            placeholder="Any Location"
                            data={[
                                { label: "All Locations", value: "ALL" },
                                { label: "Left Field", value: "LF" },
                                { label: "Center Field", value: "CF" },
                                { label: "Right Field", value: "RF" },
                                { label: "Infield", value: "IF" },
                            ]}
                            value={locationFilter}
                            onChange={setLocationFilter}
                            size="md"
                            comboboxProps={{
                                zIndex: 6000,
                                withinPortal: true,
                            }}
                        />

                        {games.length > 0 && (
                            <Select
                                label="Game"
                                placeholder="All Games"
                                data={[
                                    { label: "All Games", value: "ALL" },
                                    ...games.map((g) => {
                                        const dateStr = g.gameDate
                                            ? new Date(
                                                  g.gameDate,
                                              ).toLocaleDateString(undefined, {
                                                  month: "numeric",
                                                  day: "numeric",
                                              })
                                            : "";
                                        const label = `${dateStr ? `${dateStr} - ` : ""}${g.isHomeGame ? "vs" : "@"} ${g.opponent}`;
                                        return { label, value: g.$id };
                                    }),
                                ]}
                                value={gameFilter}
                                onChange={setGameFilter}
                                size="md"
                                comboboxProps={{
                                    zIndex: 6000,
                                    withinPortal: true,
                                }}
                            />
                        )}

                        <Stack gap="xs" mt="lg" pb="md">
                            <Button
                                variant="filled"
                                color="lime"
                                size="md"
                                fullWidth
                                onClick={toggle}
                            >
                                Apply Filters
                            </Button>
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="subtle"
                                    color="red"
                                    size="md"
                                    fullWidth
                                    onClick={resetFilters}
                                >
                                    Reset All Filters
                                </Button>
                            )}
                        </Stack>
                    </Stack>
                </DrawerContainer>
            </Stack>

            <Flex
                direction={
                    layout === "stacked"
                        ? "column"
                        : { base: "column", sm: "row" }
                }
                align="stretch"
                gap="md"
                mt="md"
            >
                <Card
                    className={styles.mapContainer}
                    radius="lg"
                    p="0px"
                    flex={
                        layout === "stacked"
                            ? "none"
                            : { base: "none", sm: "1 1 300px" }
                    }
                    style={{
                        width: "100%",
                        maxWidth: 340,
                        margin: "0 auto",
                    }}
                >
                    <Image
                        src={images.fieldSrc}
                        alt="Softball Field"
                        className={styles.mapImage}
                        draggable={false}
                    />

                    <svg className={styles.svgOverlay} viewBox="0 0 100 100">
                        {filteredHits.map((hit) => {
                            // Home plate coordinates (approximate based on field mapping)
                            const startX = ORIGIN_X;
                            const startY = ORIGIN_Y;
                            const endX = hit.hitX;
                            const endY = hit.hitY;

                            // Calculate control point for quadratic bezier to create a slight arc
                            // We offset the control point "up" (lower Y) relative to the midpoint
                            // to create an "arching" effect towards the outfield
                            const midX = (startX + endX) / 2;
                            const midY = (startY + endY) / 2;

                            // Calculate distance to scale the arc
                            const dx = endX - startX;
                            const dy = endY - startY;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            // Offset control point.
                            // A simple approach is to lift the midpoint "up" (negative Y)
                            // The amount of lift can be proportional to distance
                            const arcHeight = dist * 0.2;
                            const cpX = midX;
                            const cpY = midY - arcHeight;

                            return (
                                <path
                                    key={`path-${hit.$id}`}
                                    d={`M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`}
                                    fill="none"
                                    stroke={hit.color}
                                    strokeWidth="0.5"
                                    opacity="0.6"
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </svg>

                    {filteredHits.map((hit) => {
                        const location = hit.hitLocation || hit.direction;
                        return (
                            <Tooltip
                                key={hit.$id}
                                label={
                                    location
                                        ? `${hit.label} (${location})`
                                        : hit.label
                                }
                                withArrow
                            >
                                <Box
                                    className={styles.hitMarker}
                                    tabIndex={0}
                                    role="img"
                                    aria-label={`${hit.label}${location ? ` at ${location}` : ""}`}
                                    style={{
                                        left: `${hit.hitX}%`,
                                        top: `${hit.hitY}%`,
                                        backgroundColor: hit.color,
                                        borderColor: "white", // ensure border color is applied
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                </Card>

                <Card
                    radius="lg"
                    p="sm"
                    flex={
                        layout === "stacked"
                            ? "none"
                            : { base: "none", sm: "1 1 200px" }
                    }
                    w="100%"
                >
                    <Group justify="space-between" mb="xs">
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                            Legend
                        </Text>
                        <Text size="xs" fw={500} c="dimmed">
                            {filteredStats.total} events (
                            {filteredStats.hitsCount} hits • {filteredStats.avg}{" "}
                            AVG) in {filteredStats.totalGames}{" "}
                            {filteredStats.totalGames === 1 ? "game" : "games"}
                        </Text>
                    </Group>
                    <Flex
                        direction={
                            layout === "stacked"
                                ? "row"
                                : { base: "row", sm: "column" }
                        }
                        wrap="wrap"
                        gap="md"
                    >
                        {LEGEND_ITEMS.map((item) => (
                            <Group key={item.label} gap="xs">
                                <ColorSwatch
                                    color={item.color}
                                    size={12}
                                    withShadow={false}
                                />
                                <Text size="sm">{item.label}</Text>
                            </Group>
                        ))}
                    </Flex>
                </Card>
            </Flex>
        </Box>
    );
}
