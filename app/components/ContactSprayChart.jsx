import { useMemo, useState } from "react";

import {
    Box,
    Button,
    Card,
    Collapse,
    Chip,
    Group,
    Image,
    Select,
    Stack,
    Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconFilter,
    IconChevronDown,
    IconChevronUp,
} from "@tabler/icons-react";

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

const CATEGORIES_DATA = [
    { label: "All Results", value: "ALL" },
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

export default function ContactSprayChart({ hits = [] }) {
    const [battingSide, setBattingSide] = useState(OVERALL);
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [locationFilter, setLocationFilter] = useState("ALL");
    const [opened, { toggle }] = useDisclosure(false);

    const filteredHits = useMemo(() => {
        return hits
            .filter((hit) => {
                // Only include items with coordinates for spray chart
                if (hit.hitX == null || hit.hitY == null) return false;

                // Batting side filter
                const sideMatch =
                    battingSide === OVERALL ||
                    hit.battingSide?.toUpperCase() === battingSide;

                if (!sideMatch) return false;

                // Category filter
                const eventType = hit.eventType || hit.result;
                let normalizedKey = eventType;
                if (EVENT_TYPE_MAP[eventType]) {
                    normalizedKey = EVENT_TYPE_MAP[eventType];
                }

                if (categoryFilter === "HITS") {
                    if (!HITS.includes(normalizedKey)) return false;
                } else if (categoryFilter === "OUTS") {
                    if (!OUTS.includes(normalizedKey)) return false;
                } else if (categoryFilter !== "ALL") {
                    if (normalizedKey !== categoryFilter) return false;
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
            })
            .map((hit) => {
                // Pre-calculate normalized key, color and label to avoid duplication in render
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
            });
    }, [hits, battingSide, categoryFilter, locationFilter]);

    return (
        <Box>
            <Stack gap="xs" mb="md">
                <Group justify="space-between" align="center">
                    <Chip.Group value={battingSide} onChange={setBattingSide}>
                        <Group gap="5px">
                            <Chip value={OVERALL} variant="light" color="green">
                                All
                            </Chip>
                            <Chip value={BATS_LEFT} variant="light" color="green">
                                Left
                            </Chip>
                            <Chip
                                value={BATS_RIGHT}
                                variant="light"
                                color="green"
                            >
                                Right
                            </Chip>
                        </Group>
                    </Chip.Group>

                    <Button
                        variant="subtle"
                        color="gray"
                        size="sm"
                        leftSection={<IconFilter size={14} />}
                        rightSection={
                            opened ? (
                                <IconChevronUp size={14} />
                            ) : (
                                <IconChevronDown size={14} />
                            )
                        }
                        onClick={toggle}
                    >
                        Filters
                    </Button>
                </Group>

                <Collapse in={opened}>
                    <Card withBorder p="xs" radius="lg">
                        <Group grow>
                            <Select
                                label="Result"
                                placeholder="All"
                                data={CATEGORIES_DATA}
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                size="sm"
                                searchable
                                comboboxProps={{ zIndex: 6000 }}
                            />
                            <Select
                                label="Location"
                                placeholder="Anywhere"
                                data={[
                                    { label: "All Field", value: "ALL" },
                                    { label: "Left Field", value: "LF" },
                                    { label: "Center Field", value: "CF" },
                                    { label: "Right Field", value: "RF" },
                                    { label: "Infield", value: "IF" },
                                ]}
                                value={locationFilter}
                                onChange={setLocationFilter}
                                size="sm"
                                comboboxProps={{ zIndex: 6000 }}
                            />
                        </Group>
                        <Button
                            variant="subtle"
                            size="sm"
                            mt="xs"
                            color="red"
                            onClick={() => {
                                setCategoryFilter("ALL");
                                setLocationFilter("ALL");
                                setBattingSide(OVERALL);
                            }}
                        >
                            Reset Filters
                        </Button>
                    </Card>
                </Collapse>
            </Stack>

            <Card
                className={styles.mapContainer}
                radius="lg"
                withBorder
                p="0px"
                mt="md"
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
                    return (
                        <Tooltip
                            key={hit.$id}
                            label={`${hit.label} ${hit.hitLocation || hit.direction ? `(${hit.hitLocation || hit.direction})` : ""}`}
                            withArrow
                        >
                            <Box
                                className={styles.hitMarker}
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

            {/* Legend could be added here if needed */}
        </Box>
    );
}
