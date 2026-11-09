import { useState } from "react";
import PropTypes from "prop-types";
import {
    Card,
    Group,
    Badge,
    Text,
    Stack,
    Box,
    Flex,
    Chip,
    Button,
    ActionIcon,
    Tooltip,
} from "@mantine/core";
import {
    IconShield,
    IconFocus2,
    IconX,
    IconBulb,
    IconCompass,
} from "@tabler/icons-react";
import styles from "./DefensivePlaybook.module.css";
import { PRIORITY_COLORS } from "./DefensiveField";

const PRIORITY_BADGE_CLASSES = {
    primary: styles.badgePrimary,
    cutoff: styles.badgeCutoff,
    coverage: styles.badgeCoverage,
    backup: styles.badgeBackup,
};

/**
 * FielderDetailsPanel Component
 *
 * Displays the 10-player defensive assignments with coaching cues,
 * roles, priority tags, and interactive fielder highlighting.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.fielders - Array of 10 fielder assignment objects
 * @param {string|null} props.selectedFielderId - Currently focused fielder posId
 * @param {Function} props.onSelectFielder - Selection callback function
 * @returns {JSX.Element}
 */
export default function FielderDetailsPanel({
    fielders = [],
    selectedFielderId = null,
    onSelectFielder = () => {},
}) {
    const [priorityFilter, setPriorityFilter] = useState("all");

    const filteredFielders = fielders.filter((f) => {
        if (priorityFilter === "all") return true;
        return f.priority === priorityFilter;
    });

    return (
        <Card radius="md" p="md" className={styles.coachingCard}>
            <Stack gap="sm">
                <Flex
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap="xs"
                >
                    <Group gap="xs">
                        <IconShield size={20} color="#CCFF33" />
                        <Text fw={700} size="sm" c="white">
                            Fielder Responsibilities (10-Player Alignment)
                        </Text>
                    </Group>

                    {selectedFielderId && (
                        <Button
                            variant="subtle"
                            color="gray"
                            size="xs"
                            rightSection={<IconX size={14} />}
                            onClick={() => onSelectFielder(null)}
                        >
                            Clear Focus
                        </Button>
                    )}
                </Flex>

                {/* Priority quick filters */}
                <Chip.Group value={priorityFilter} onChange={setPriorityFilter}>
                    <Group gap="xs">
                        <Chip
                            value="all"
                            size="xs"
                            variant="light"
                            color="gray"
                        >
                            All (10)
                        </Chip>
                        <Chip
                            value="primary"
                            size="xs"
                            variant="light"
                            color="lime"
                        >
                            Primary
                        </Chip>
                        <Chip
                            value="cutoff"
                            size="xs"
                            variant="light"
                            color="orange"
                        >
                            Cutoff / Relay
                        </Chip>
                        <Chip
                            value="coverage"
                            size="xs"
                            variant="light"
                            color="blue"
                        >
                            Coverage
                        </Chip>
                        <Chip
                            value="backup"
                            size="xs"
                            variant="light"
                            color="grape"
                        >
                            Backup
                        </Chip>
                    </Group>
                </Chip.Group>

                {/* Roster List */}
                <Stack gap="xs" mt="xs">
                    {filteredFielders.map((f) => {
                        const isSelected = selectedFielderId === f.posId;
                        const badgeClass =
                            PRIORITY_BADGE_CLASSES[f.priority] ||
                            styles.badgeCoverage;

                        return (
                            <Box
                                key={f.posId}
                                className={`${styles.coachingCard} ${
                                    isSelected ? styles.coachingCardActive : ""
                                }`}
                                p="xs"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: 8,
                                    border: isSelected
                                        ? "1px solid #CCFF33"
                                        : "1px solid rgba(255, 255, 255, 0.08)",
                                }}
                                onClick={() =>
                                    onSelectFielder(isSelected ? null : f.posId)
                                }
                                role="button"
                                tabIndex={0}
                                aria-pressed={isSelected}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        onSelectFielder(
                                            isSelected ? null : f.posId,
                                        );
                                    }
                                }}
                            >
                                <Flex
                                    justify="space-between"
                                    align="flex-start"
                                    gap="xs"
                                >
                                    <Group gap="xs" align="center">
                                        <Badge
                                            size="md"
                                            radius="sm"
                                            style={{
                                                background:
                                                    f.priority === "primary"
                                                        ? "#CCFF33"
                                                        : "#1F2937",
                                                color:
                                                    f.priority === "primary"
                                                        ? "#111827"
                                                        : "#FFFFFF",
                                                border: `1px solid ${
                                                    PRIORITY_COLORS[
                                                        f.priority
                                                    ] || "#38BDF8"
                                                }`,
                                                fontWeight: 800,
                                                minWidth: 38,
                                                textAlign: "center",
                                            }}
                                        >
                                            {f.posId}
                                        </Badge>

                                        <Box>
                                            <Text size="sm" fw={700} c="white">
                                                {f.label}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {f.role}
                                            </Text>
                                        </Box>
                                    </Group>

                                    <Group gap="xs">
                                        <Badge
                                            size="xs"
                                            radius="xl"
                                            className={badgeClass}
                                        >
                                            {f.priority}
                                        </Badge>

                                        <Tooltip
                                            label={
                                                isSelected
                                                    ? "Unfocus"
                                                    : "Focus on Field"
                                            }
                                        >
                                            <ActionIcon
                                                size="sm"
                                                variant={
                                                    isSelected
                                                        ? "filled"
                                                        : "subtle"
                                                }
                                                color={
                                                    isSelected ? "lime" : "gray"
                                                }
                                                aria-label={`Focus ${f.label}`}
                                            >
                                                <IconFocus2 size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Flex>

                                {/* Coaching Cue / Notes */}
                                {f.notes && (
                                    <Group
                                        gap="xs"
                                        align="flex-start"
                                        mt="xs"
                                        pl="sm"
                                    >
                                        <IconBulb
                                            size={14}
                                            color="#CCFF33"
                                            style={{
                                                flexShrink: 0,
                                                marginTop: 2,
                                            }}
                                        />
                                        <Text
                                            size="xs"
                                            c="gray.4"
                                            style={{ lineHeight: 1.4 }}
                                        >
                                            {f.notes}
                                        </Text>
                                    </Group>
                                )}

                                {/* Target Coordinates */}
                                {f.target && (
                                    <Group gap="xs" mt={4} pl="sm">
                                        <IconCompass size={12} color="gray" />
                                        <Text size="10px" c="dimmed">
                                            Target: {f.target.x}%, {f.target.y}%
                                        </Text>
                                    </Group>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </Stack>
        </Card>
    );
}

FielderDetailsPanel.propTypes = {
    fielders: PropTypes.arrayOf(
        PropTypes.shape({
            posId: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            target: PropTypes.shape({
                x: PropTypes.number.isRequired,
                y: PropTypes.number.isRequired,
            }),
            role: PropTypes.string.isRequired,
            priority: PropTypes.string.isRequired,
            notes: PropTypes.string,
        }),
    ),
    selectedFielderId: PropTypes.string,
    onSelectFielder: PropTypes.func,
};
