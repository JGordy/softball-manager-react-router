import { useMemo, useState, useEffect, Fragment } from "react";
import {
    Table,
    ScrollArea,
    Text,
    Card,
    Group,
    Select,
    ActionIcon,
    Tooltip,
} from "@mantine/core";
import {
    IconCornerDownRight,
    IconSortAscending,
    IconSortDescending,
    IconArrowsSort,
    IconChevronUp,
    IconChevronDown,
    IconSelector,
} from "@tabler/icons-react";

import { calculateGameStats, calculateTeamTotals } from "@/utils/stats";
import { getActivePlayerId } from "@/routes/gameday/utils/gamedayUtils";

import styles from "./BoxScore.module.css";

const GAMEDAY_SORT_OPTIONS = [
    { value: "lineup", label: "Lineup Order" },
    { value: "player", label: "Batter" },
    { value: "AB", label: "AB - At Bats" },
    { value: "H", label: "H - Hits" },
    { value: "RBI", label: "RBI - Runs Batted In" },
    { value: "R", label: "R - Runs" },
    { value: "HR", label: "HR - Home Runs" },
    { value: "BB", label: "BB - Walks" },
    { value: "K", label: "K - Strikeouts" },
    { value: "AVG", label: "AVG - Batting Average" },
    { value: "OBP", label: "OBP - On-Base %" },
    { value: "OPS", label: "OPS - On-Base + Slugging" },
];

const SEASON_SORT_OPTIONS = [
    { value: "AVG", label: "AVG - Batting Average" },
    { value: "player", label: "Batter" },
    { value: "AB", label: "AB - At Bats" },
    { value: "H", label: "H - Hits" },
    { value: "RBI", label: "RBI - Runs Batted In" },
    { value: "R", label: "R - Runs" },
    { value: "HR", label: "HR - Home Runs" },
    { value: "BB", label: "BB - Walks" },
    { value: "K", label: "K - Strikeouts" },
    { value: "OBP", label: "OBP - On-Base %" },
    { value: "OPS", label: "OPS - On-Base + Slugging" },
];

const COLUMNS = [
    { key: "player", label: "Batter", align: "left", width: undefined },
    { key: "AB", label: "AB", align: "center", width: 50 },
    { key: "H", label: "H", align: "center", width: 50 },
    { key: "RBI", label: "RBI", align: "center", width: 50 },
    { key: "R", label: "R", align: "center", width: 50 },
    { key: "HR", label: "HR", align: "center", width: 50 },
    { key: "BB", label: "BB", align: "center", width: 50 },
    { key: "K", label: "K", align: "center", width: 50 },
    { key: "AVG", label: "AVG", align: "center", width: 70 },
    { key: "OBP", label: "OBP", align: "center", width: 70 },
    { key: "OPS", label: "OPS", align: "center", width: 70 },
];

/**
 * Comparator function to sort player stat objects.
 *
 * @param {Object} a - First player stat object
 * @param {Object} b - Second player stat object
 * @param {string} col - Column key to sort by
 * @param {"asc"|"desc"} dir - Sort direction
 * @returns {number} Comparison result
 */
export const compareStats = (a, b, col, dir) => {
    const multiplier = dir === "asc" ? 1 : -1;

    if (col === "player") {
        const nameA = `${a.player?.firstName || ""} ${a.player?.lastName || ""}`
            .trim()
            .toLowerCase();
        const nameB = `${b.player?.firstName || ""} ${b.player?.lastName || ""}`
            .trim()
            .toLowerCase();
        return multiplier * nameA.localeCompare(nameB);
    }

    // Rate stats (AVG, OBP, OPS)
    if (col === "AVG" || col === "OBP" || col === "OPS") {
        const valA = parseFloat(a[col]) || 0;
        const valB = parseFloat(b[col]) || 0;
        if (valA !== valB) {
            return multiplier * (valA - valB);
        }
        // Secondary tiebreaker: AB (higher volume first)
        if (b.AB !== a.AB) return b.AB - a.AB;
        return (a.player?.firstName || "").localeCompare(
            b.player?.firstName || "",
        );
    }

    // Counting stats (AB, H, RBI, R, HR, BB, K)
    const valA = Number(a[col]) || 0;
    const valB = Number(b[col]) || 0;
    if (valA !== valB) {
        return multiplier * (valA - valB);
    }
    // Secondary tiebreaker: AB
    if (col !== "AB" && b.AB !== a.AB) {
        return b.AB - a.AB;
    }
    // Tertiary tiebreaker: AVG
    const avgA = parseFloat(a.AVG) || 0;
    const avgB = parseFloat(b.AVG) || 0;
    if (avgA !== avgB) return avgB - avgA;

    return (a.player?.firstName || "").localeCompare(b.player?.firstName || "");
};

/**
 * Renders a Box Score statistics table for a game or a season with interactive column sorting.
 *
 * @param {Object} props - Component props
 * @param {Array} props.logs - Array of game log objects
 * @param {Array} [props.playerChart=[]] - Array of player objects representing the lineup (game view)
 * @param {Object} [props.currentBatter] - Current batter object
 * @param {boolean} [props.gameFinal=false] - Whether the game has ended
 * @param {boolean} [props.isOpponent=false] - Whether this shows opponent team stats
 * @param {boolean} [props.isHomeGame] - Whether this is a home game
 * @param {boolean} [props.seasonView=false] - If true, aggregates and renders stats by player for the season
 * @param {Array} [props.players=[]] - List of roster players (required if seasonView is true)
 * @returns {JSX.Element} The Box Score card containing the stats table
 */
export default function BoxScore({
    logs,
    playerChart = [],
    currentBatter,
    gameFinal = false,
    isOpponent = false,
    isHomeGame,
    seasonView = false,
    players = [],
}) {
    const [sortColumn, setSortColumn] = useState(seasonView ? "AVG" : "lineup");
    const [sortDirection, setSortDirection] = useState("desc");

    useEffect(() => {
        setSortColumn(seasonView ? "AVG" : "lineup");
        setSortDirection("desc");
    }, [seasonView]);

    const { stats, totals } = useMemo(() => {
        const stats = calculateGameStats(
            logs,
            seasonView ? players : playerChart,
            isOpponent,
            isHomeGame,
        );
        const totals = calculateTeamTotals(stats);
        return { stats, totals };
    }, [logs, playerChart, players, isOpponent, isHomeGame, seasonView]);

    // O(1) Lookup Map for Stats
    const statsMap = useMemo(() => {
        const map = new Map();
        stats.forEach((s) => map.set(s.player.$id, s));
        return map;
    }, [stats]);

    // Set of sub player IDs for game view
    const subIdSet = useMemo(() => {
        const set = new Set();
        playerChart.forEach((slot) => {
            slot.substitutions?.forEach((sub) => {
                if (sub.playerId) set.add(sub.playerId);
            });
        });
        return set;
    }, [playerChart]);

    // Check for duplicate first names
    const firstNameCounts = useMemo(() => {
        const counts = {};
        stats.forEach((stat) => {
            const firstName = stat.player.firstName;
            counts[firstName] = (counts[firstName] || 0) + 1;
        });
        return counts;
    }, [stats]);

    const isLineupOrder = !seasonView && sortColumn === "lineup";

    /**
     * Handles selection of a sort field from the dropdown.
     *
     * @param {string|null} value - The selected column key
     */
    const handleSelectSort = (value) => {
        if (!value || value === "lineup") {
            setSortColumn(seasonView ? "AVG" : "lineup");
            setSortDirection("desc");
            return;
        }
        setSortColumn(value);
        setSortDirection(value === "player" ? "asc" : "desc");
    };

    /**
     * Toggles the current sort direction between asc and desc.
     */
    const toggleSortDirection = () => {
        if (isLineupOrder) return;
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    /**
     * Handles clicking on a table header to sort or cycle sort states.
     *
     * @param {string} colKey - The column key clicked
     */
    const handleHeaderClick = (colKey) => {
        if (sortColumn === colKey) {
            if (colKey === "player") {
                // Text column cycle: asc -> desc -> reset
                if (sortDirection === "asc") {
                    setSortDirection("desc");
                } else {
                    // Reset to default
                    if (seasonView) {
                        setSortColumn("AVG");
                        setSortDirection("desc");
                    } else {
                        setSortColumn("lineup");
                        setSortDirection("desc");
                    }
                }
            } else if (colKey === "AVG" && seasonView) {
                // Season view default column toggles between desc and asc
                setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
            } else {
                // Numeric stats cycle: desc -> asc -> reset
                if (sortDirection === "desc") {
                    setSortDirection("asc");
                } else {
                    // Reset to default
                    if (seasonView) {
                        setSortColumn("AVG");
                        setSortDirection("desc");
                    } else {
                        setSortColumn("lineup");
                        setSortDirection("desc");
                    }
                }
            }
        } else {
            setSortColumn(colKey);
            setSortDirection(colKey === "player" ? "asc" : "desc");
        }
    };

    // Helper to render a single row
    const renderRow = (stat, isSub = false) => {
        if (!stat) return null;

        const activeId = getActivePlayerId(currentBatter);

        const isCurrentBatter =
            !gameFinal && currentBatter && stat.player.$id === activeId;

        const jersey = stat.player.jerseyNumber
            ? `#${stat.player.jerseyNumber} `
            : "";
        const hasDuplicateFirstName =
            firstNameCounts[stat.player.firstName] > 1;
        const displayName = hasDuplicateFirstName
            ? `${stat.player.firstName} ${stat.player.lastName ? stat.player.lastName.charAt(0) : ""}.`
            : stat.player.firstName;

        return (
            <Table.Tr
                key={stat.player.$id}
                bg={
                    isCurrentBatter
                        ? "var(--mantine-color-blue-light)"
                        : undefined
                }
            >
                <Table.Td>
                    <Group gap={4} wrap="nowrap" pl={isSub ? "xs" : 0}>
                        {isSub && (
                            <IconCornerDownRight
                                size={14}
                                color="var(--mantine-color-dimmed)"
                            />
                        )}
                        <Text
                            size="sm"
                            fw={isCurrentBatter ? 700 : isSub ? 400 : 500}
                            c={isSub ? "dimmed" : undefined}
                            style={{ whiteSpace: "nowrap" }}
                            truncate="end"
                            component="div"
                        >
                            {jersey && (
                                <Text
                                    inherit
                                    display="inline"
                                    c="dimmed"
                                    fw={isCurrentBatter ? 800 : 400}
                                    mr={2}
                                    component="span"
                                >
                                    {jersey}
                                </Text>
                            )}
                            {displayName}
                        </Text>
                    </Group>
                </Table.Td>
                <Table.Td ta="center">{stat.AB}</Table.Td>
                <Table.Td ta="center">{stat.H}</Table.Td>
                <Table.Td ta="center">{stat.RBI}</Table.Td>
                <Table.Td ta="center">{stat.R}</Table.Td>
                <Table.Td ta="center">{stat.HR}</Table.Td>
                <Table.Td ta="center">{stat.BB}</Table.Td>
                <Table.Td ta="center">{stat.K}</Table.Td>
                <Table.Td ta="center" fw={700}>
                    {stat.AVG}
                </Table.Td>
                <Table.Td ta="center" c="dimmed">
                    {stat.OBP}
                </Table.Td>
                <Table.Td ta="center" c="dimmed">
                    {stat.OPS}
                </Table.Td>
            </Table.Tr>
        );
    };

    const sortedStats = useMemo(() => {
        if (isLineupOrder) return stats;
        return [...stats].sort((a, b) =>
            compareStats(a, b, sortColumn, sortDirection),
        );
    }, [stats, isLineupOrder, sortColumn, sortDirection]);

    const rows = useMemo(() => {
        if (seasonView || sortColumn !== "lineup") {
            return sortedStats.map((stat) =>
                renderRow(stat, !seasonView && subIdSet.has(stat.player.$id)),
            );
        }

        return playerChart.map((slot) => {
            const starterStat = statsMap.get(slot.$id);
            const subIds = Array.from(
                new Set(slot.substitutions?.map((s) => s.playerId) || []),
            );
            const subStats = subIds
                .map((subId) => statsMap.get(subId))
                .filter(Boolean);

            return (
                <Fragment key={`slot-${slot.$id}`}>
                    {renderRow(starterStat, false)}
                    {subStats.map((subStat) => renderRow(subStat, true))}
                </Fragment>
            );
        });
    }, [seasonView, sortColumn, sortedStats, playerChart, statsMap, subIdSet]);

    const sortOptions = seasonView ? SEASON_SORT_OPTIONS : GAMEDAY_SORT_OPTIONS;

    return (
        <Card p={0} radius="md">
            <div className={styles.toolbar}>
                <Group justify="space-between" align="center" w="100%">
                    <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                        Sort
                    </Text>
                    <Group gap="xs" wrap="nowrap">
                        <Select
                            size="xs"
                            aria-label="Sort by column"
                            data={sortOptions}
                            value={sortColumn}
                            onChange={handleSelectSort}
                            allowDeselect={false}
                            leftSection={<IconArrowsSort size={14} />}
                            className={styles.sortSelect}
                        />
                        <Tooltip
                            label={
                                isLineupOrder
                                    ? "Lineup order cannot be reversed"
                                    : sortDirection === "asc"
                                      ? "Sorted Low to High (Click to sort High to Low)"
                                      : "Sorted High to Low (Click to sort Low to High)"
                            }
                        >
                            <ActionIcon
                                size="input-xs"
                                variant="default"
                                onClick={toggleSortDirection}
                                disabled={isLineupOrder}
                                aria-label={
                                    sortDirection === "asc"
                                        ? "Sort descending"
                                        : "Sort ascending"
                                }
                            >
                                {sortDirection === "asc" ? (
                                    <IconSortAscending size={16} />
                                ) : (
                                    <IconSortDescending size={16} />
                                )}
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </div>
            <ScrollArea>
                <Table striped highlightOnHover verticalSpacing="xs">
                    <Table.Thead>
                        <Table.Tr>
                            {COLUMNS.map(({ key, label, align, width }) => {
                                const isSorted = sortColumn === key;
                                return (
                                    <Table.Th
                                        key={key}
                                        ta={align}
                                        w={width}
                                        aria-sort={
                                            isSorted
                                                ? sortDirection === "asc"
                                                    ? "ascending"
                                                    : "descending"
                                                : "none"
                                        }
                                    >
                                        <button
                                            type="button"
                                            className={`${styles.thButton} ${align === "left" ? styles.thButtonLeft : styles.thButtonCenter}`}
                                            onClick={() =>
                                                handleHeaderClick(key)
                                            }
                                            aria-label={`Sort by ${label}`}
                                        >
                                            <Group
                                                gap={2}
                                                wrap="nowrap"
                                                justify={
                                                    align === "left"
                                                        ? "flex-start"
                                                        : "center"
                                                }
                                            >
                                                <Text
                                                    inherit
                                                    fw={
                                                        isSorted
                                                            ? 700
                                                            : undefined
                                                    }
                                                    c={
                                                        isSorted
                                                            ? "var(--mantine-primary-color-filled)"
                                                            : undefined
                                                    }
                                                >
                                                    {label}
                                                </Text>
                                                <span
                                                    className={`${styles.sortIcon} ${isSorted ? styles.sortIconActive : styles.sortIconInactive}`}
                                                >
                                                    {isSorted ? (
                                                        sortDirection ===
                                                        "asc" ? (
                                                            <IconChevronUp
                                                                size={14}
                                                                stroke={2.5}
                                                            />
                                                        ) : (
                                                            <IconChevronDown
                                                                size={14}
                                                                stroke={2.5}
                                                            />
                                                        )
                                                    ) : (
                                                        <IconSelector
                                                            size={14}
                                                            stroke={1.5}
                                                        />
                                                    )}
                                                </span>
                                            </Group>
                                        </button>
                                    </Table.Th>
                                );
                            })}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                    <Table.Tfoot>
                        <Table.Tr fw={700}>
                            <Table.Td>TOTALS</Table.Td>
                            <Table.Td ta="center">{totals.AB}</Table.Td>
                            <Table.Td ta="center">{totals.H}</Table.Td>
                            <Table.Td ta="center">{totals.RBI}</Table.Td>
                            <Table.Td ta="center">{totals.R}</Table.Td>
                            <Table.Td ta="center">{totals.HR}</Table.Td>
                            <Table.Td ta="center">{totals.BB}</Table.Td>
                            <Table.Td ta="center">{totals.K}</Table.Td>
                            <Table.Td ta="center">{totals.AVG}</Table.Td>
                            <Table.Td ta="center">{totals.OBP}</Table.Td>
                            <Table.Td ta="center">{totals.OPS}</Table.Td>
                        </Table.Tr>
                    </Table.Tfoot>
                </Table>
            </ScrollArea>
        </Card>
    );
}
