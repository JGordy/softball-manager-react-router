import { Paper, Stack, Table, Text, Title } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

/** Maps raw Appwrite function names to human-readable labels */
const FUNCTION_LABELS = {
    game_award_tally: "Game Award Tally",
    gametime_reminders: "Gametime Reminders",
};

/**
 * Converts a raw function name to a readable title as a fallback (e.g.
 * "my_function_name" → "My Function Name").
 *
 * @param {string} name - Raw function name from Appwrite
 * @returns {string}
 */
function humanizeName(name) {
    return name
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

/**
 * Displays the health status of all deployed Appwrite Cloud Functions,
 * including their enabled state and last run timestamp.
 *
 * @param {{ functions: Array<{id: string, name: string, enabled: boolean, lastRun: string|null}> }} props
 * @returns {JSX.Element|null}
 */
export const FunctionHealth = ({ functions }) => {
    if (!functions || functions.length === 0) return null;

    return (
        <Paper withBorder p="md" radius="md" mb="xl">
            <Stack gap="sm">
                <Title order={3}>Cloud Functions</Title>

                <Table withRowBorders={false} verticalSpacing="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>
                                <Text size="xs" c="dimmed">
                                    Function
                                </Text>
                            </Table.Th>
                            <Table.Th style={{ width: 80 }}>
                                <Text size="xs" c="dimmed">
                                    Enabled
                                </Text>
                            </Table.Th>
                            <Table.Th>
                                <Text size="xs" c="dimmed">
                                    Last Run
                                </Text>
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {functions.map((fn) => (
                            <Table.Tr key={fn.id}>
                                <Table.Td>
                                    <Text size="sm" fw={500}>
                                        {FUNCTION_LABELS[fn.name] ??
                                            humanizeName(fn.name)}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    {fn.enabled ? (
                                        <IconCheck
                                            size={18}
                                            color="var(--mantine-color-lime-4)"
                                            stroke={2.5}
                                            aria-label="Enabled"
                                        />
                                    ) : (
                                        <IconX
                                            size={16}
                                            color="var(--mantine-color-dimmed)"
                                            aria-label="Disabled"
                                        />
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Text size="xs" c="dimmed">
                                        {fn.lastRun
                                            ? new Date(
                                                  fn.lastRun,
                                              ).toLocaleString([], {
                                                  month: "numeric",
                                                  day: "numeric",
                                                  year: "2-digit",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "Never"}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Stack>
        </Paper>
    );
};
