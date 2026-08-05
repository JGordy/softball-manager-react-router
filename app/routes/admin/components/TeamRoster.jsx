import {
    Badge,
    Group,
    Paper,
    Progress,
    Stack,
    Table,
    Text,
    Title,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

/**
 * Displays all Appwrite Teams sorted by member count, with a "Sparse" warning
 * badge on teams that have two or fewer members (likely test or ghost teams).
 *
 * @param {{ teams: Array<{id: string, name: string, memberCount: number, isGhost: boolean}> }} props
 * @returns {JSX.Element|null}
 */
export const TeamRoster = ({ teams }) => {
    if (!teams || teams.length === 0) return null;

    const maxMembers = Math.max(...teams.map((t) => t.memberCount), 1);

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
                <Title order={3}>Team Rosters</Title>

                <Table withRowBorders={false} verticalSpacing="xs">
                    <Table.Tbody>
                        {teams.map((team) => (
                            <Table.Tr key={team.id}>
                                <Table.Td p={0}>
                                    <Group justify="space-between" mb={4}>
                                        <Group gap="xs">
                                            <Text size="sm" fw={500}>
                                                {team.name}
                                            </Text>
                                            {team.isGhost && (
                                                <Badge
                                                    color="yellow"
                                                    variant="light"
                                                    size="xs"
                                                    leftSection={
                                                        <IconAlertTriangle
                                                            size={10}
                                                        />
                                                    }
                                                >
                                                    Sparse
                                                </Badge>
                                            )}
                                        </Group>
                                        <Badge
                                            color={
                                                team.isGhost ? "yellow" : "blue"
                                            }
                                            variant="light"
                                            size="xs"
                                        >
                                            {team.memberCount}{" "}
                                            {team.memberCount === 1
                                                ? "member"
                                                : "members"}
                                        </Badge>
                                    </Group>
                                    <Progress
                                        value={
                                            (team.memberCount / maxMembers) *
                                            100
                                        }
                                        size="xs"
                                        radius="xl"
                                        color={team.isGhost ? "yellow" : "blue"}
                                        mb="sm"
                                    />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Stack>
        </Paper>
    );
};
