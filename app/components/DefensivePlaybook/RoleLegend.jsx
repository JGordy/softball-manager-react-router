import { Group, Box, Text } from "@mantine/core";
import { PRIORITY_COLORS } from "./DefensiveField";

/**
 * Tactical role definition items for the playbook legend.
 */
const ROLE_ITEMS = [
    { key: "primary", label: "Primary", color: PRIORITY_COLORS.primary },
    { key: "cutoff", label: "Cutoff", color: PRIORITY_COLORS.cutoff },
    { key: "coverage", label: "Coverage", color: PRIORITY_COLORS.coverage },
    { key: "backup", label: "Backup", color: PRIORITY_COLORS.backup },
];

/**
 * RoleLegend Component
 *
 * Small, easy-to-read horizontal legend displayed above the playback controls
 * and below the diamond field. Explains the tactical color coding used for
 * fielder nodes and movement vectors across all plays.
 *
 * @returns {JSX.Element}
 */
export default function RoleLegend() {
    return (
        <Group
            justify="center"
            align="center"
            gap="md"
            py={2}
            wrap="wrap"
            role="group"
            aria-label="Fielder role color legend"
        >
            {ROLE_ITEMS.map(({ key, label, color }) => (
                <Group key={key} gap={6} align="center">
                    <Box
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: color,
                            boxShadow: `0 0 6px ${color}88`,
                        }}
                        aria-hidden="true"
                    />
                    <Text
                        size="xs"
                        c="dimmed"
                        fw={600}
                        style={{ letterSpacing: "0.2px" }}
                    >
                        {label}
                    </Text>
                </Group>
            ))}

            {/* Visual separator */}
            <Box
                style={{
                    width: 1,
                    height: 12,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                }}
                aria-hidden="true"
            />

            {/* Ball Trajectory Keys (Hit: Dotted White, Throw: Dashed Lime) */}
            <Group gap={6} align="center">
                <Box
                    style={{
                        width: 16,
                        height: 0,
                        borderBottom: "2px dotted #FFFFFF",
                        opacity: 0.9,
                    }}
                    aria-hidden="true"
                />
                <Text
                    size="xs"
                    c="dimmed"
                    fw={600}
                    style={{ letterSpacing: "0.2px" }}
                >
                    Hit
                </Text>
            </Group>
            <Group gap={6} align="center">
                <Box
                    style={{
                        width: 16,
                        height: 0,
                        borderBottom: `2px dashed ${PRIORITY_COLORS.primary}`,
                        opacity: 0.9,
                    }}
                    aria-hidden="true"
                />
                <Text
                    size="xs"
                    c="dimmed"
                    fw={600}
                    style={{ letterSpacing: "0.2px" }}
                >
                    Throw
                </Text>
            </Group>
        </Group>
    );
}
