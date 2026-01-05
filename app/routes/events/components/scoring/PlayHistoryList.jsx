import { ScrollArea, Text, Group, Stack, Paper, Badge } from "@mantine/core";

export default function PlayHistoryList({ logs }) {
    if (!logs.length) {
        return (
            <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed" ta="center">
                    No plays logged yet for this game.
                </Text>
            </Paper>
        );
    }

    return (
        <ScrollArea h={400} offsetScrollbars>
            <Stack gap="xs">
                {[...logs].reverse().map((log) => (
                    <Paper key={log.$id} withBorder p="xs" radius="md">
                        <Group justify="space-between" wrap="nowrap">
                            <Stack gap={2}>
                                <Text size="sm" fw={700}>
                                    {log.description}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Inning {log.inning} •{" "}
                                    {log.halfInning === "top"
                                        ? "Top"
                                        : "Bottom"}
                                </Text>
                            </Stack>

                            <Group gap={5} wrap="nowrap">
                                {log.rbi > 0 && (
                                    <Badge
                                        size="sm"
                                        color="blue"
                                        variant="filled"
                                    >
                                        {log.rbi}{" "}
                                        {log.rbi === 1 ? "RBI" : "RBIs"}
                                    </Badge>
                                )}
                                {log.outsOnPlay > 0 && (
                                    <Badge
                                        size="sm"
                                        color="red"
                                        variant="filled"
                                    >
                                        {log.outsOnPlay}{" "}
                                        {log.outsOnPlay === 1 ? "Out" : "Outs"}
                                    </Badge>
                                )}
                            </Group>
                        </Group>
                    </Paper>
                ))}
            </Stack>
        </ScrollArea>
    );
}
