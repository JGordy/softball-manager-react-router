import {
    Badge,
    Group,
    Paper,
    ScrollArea,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { SankeyChart } from "@mantine/charts";
import { IconActivity, IconArrowsLeftRight } from "@tabler/icons-react";

/** Node color mapping matching Velocity Dark theme */
const CATEGORY_COLORS = {
    hits: "#4ADE80", // Green
    outs: "#F87171", // Red / Coral
    misc: "#38BDF8", // Cyan
};

const SPECIFIC_COLORS = {
    single: "#84CC16", // Lime
    double: "#60A5FA", // Blue
    triple: "#C084FC", // Purple
    homerun: "#FACC15", // Gold
    walk: "#38BDF8", // Cyan
    strikeout: "#EF4444", // Deep Red
    ground_out: "#F97316", // Orange
    fly_out: "#FB923C", // Light Orange
    line_out: "#F43F5E", // Rose
    pop_out: "#EA580C", // Dark Orange
    error: "#EC4899", // Pink
    fielders_choice: "#F59E0B", // Amber
    sacrifice_fly: "#A855F7", // Purple
    injury_remove: "#64748B", // Slate
};

const HIT_TYPES = ["single", "double", "triple", "homerun"];
const OUT_TYPES = ["strikeout", "ground_out", "fly_out", "line_out", "pop_out"];

/**
 * Builds Sankey nodes and links data for 3-tier play-by-play flow:
 * Tier 1: "All Plays"
 * Tier 2: "Hits", "Outs", "Misc"
 * Tier 3: Individual outcome types (Single, Double, HR, Ground Out, Walk, etc.)
 */
function buildSankeyData(byType = [], total = 0) {
    if (!byType || byType.length === 0 || total === 0) {
        return { nodes: [], links: [] };
    }

    const nodes = [
        { name: "All Plays", color: "#CCFF33" }, // Node 0
        { name: "Hits", color: CATEGORY_COLORS.hits }, // Node 1
        { name: "Outs", color: CATEGORY_COLORS.outs }, // Node 2
        { name: "Misc", color: CATEGORY_COLORS.misc }, // Node 3
    ];

    const links = [];
    let hitsTotal = 0;
    let outsTotal = 0;
    let miscTotal = 0;

    byType.forEach(({ type, label, count }) => {
        if (!count || count <= 0) return;

        let parentIndex = 3; // Default to Misc
        if (HIT_TYPES.includes(type)) {
            parentIndex = 1;
            hitsTotal += count;
        } else if (OUT_TYPES.includes(type)) {
            parentIndex = 2;
            outsTotal += count;
        } else {
            miscTotal += count;
        }

        const nodeIndex = nodes.length;
        const color = SPECIFIC_COLORS[type] || "#94A3B8";
        nodes.push({ name: `${label} (${count})`, color });

        // Tier 2 ➔ Tier 3 link (subtle stream color inherited via linkColor/linkOpacity)
        links.push({
            source: parentIndex,
            target: nodeIndex,
            value: count,
        });
    });

    // Tier 1 ➔ Tier 2 links
    if (hitsTotal > 0) {
        links.unshift({
            source: 0,
            target: 1,
            value: hitsTotal,
        });
    }
    if (outsTotal > 0) {
        links.unshift({
            source: 0,
            target: 2,
            value: outsTotal,
        });
    }
    if (miscTotal > 0) {
        links.unshift({
            source: 0,
            target: 3,
            value: miscTotal,
        });
    }

    return { nodes, links };
}

/**
 * Displays an interactive 3-tier Sankey Flow Chart visualizing how total team plays
 * flow into play categories (Hits, Outs, Misc) and specific play outcomes.
 *
 * @param {{ logsStats: {
 *   total: number,
 *   avgPerGame: string,
 *   byType: Array<{type: string, label: string, count: number, percentage: number}>
 * }}} props
 * @returns {JSX.Element|null}
 */
export const GameLogsBreakdown = ({ logsStats }) => {
    if (!logsStats) return null;

    const { total = 0, avgPerGame = "0", byType = [] } = logsStats;
    const sankeyData = buildSankeyData(byType, total);

    return (
        <Paper withBorder p="md" radius="md" mb="xl">
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Title order={3}>Play-by-Play Flow</Title>
                        <Text size="xs" c="dimmed" mt={2}>
                            {total.toLocaleString()} total logged events (
                            {avgPerGame} per game)
                        </Text>
                    </Stack>
                    <Group gap="xs">
                        <Badge
                            variant="light"
                            color="cyan"
                            size="xs"
                            leftSection={<IconArrowsLeftRight size={10} />}
                        >
                            Swipe to view flow
                        </Badge>
                        <Badge
                            variant="light"
                            color="lime"
                            size="sm"
                            leftSection={<IconActivity size={12} />}
                        >
                            {total.toLocaleString()} events
                        </Badge>
                    </Group>
                </Group>

                {byType.length > 0 && sankeyData.nodes.length > 0 ? (
                    <Stack gap="xs">
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                            Team Outcome Flow (All-Time)
                        </Text>

                        <ScrollArea
                            type="auto"
                            offsetScrollbars
                            style={{ width: "100%" }}
                        >
                            <div
                                style={{
                                    minWidth: 580,
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                }}
                            >
                                <SankeyChart
                                    data={sankeyData}
                                    height={380}
                                    nodeWidth={14}
                                    nodePadding={18}
                                    linkColor="gray.7"
                                    linkOpacity={0.15}
                                    textColor="#FFFFFF"
                                />
                            </div>
                        </ScrollArea>
                    </Stack>
                ) : (
                    <Text size="sm" c="dimmed">
                        No play-by-play events recorded yet.
                    </Text>
                )}
            </Stack>
        </Paper>
    );
};
