import {
    Badge,
    Group,
    Paper,
    RingProgress,
    Stack,
    Text,
    Title,
} from "@mantine/core";

export const AttendanceHealth = ({ attendance }) => {
    const {
        accepted = 0,
        declined = 0,
        tentative = 0,
        total = 0,
    } = attendance || {};
    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between" align="center">
                <Stack gap={0}>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        Platform Attendance
                    </Text>
                    <Title order={2}>Show-up Rate</Title>
                    <Text size="sm" mt="xs" c="dimmed">
                        {accepted.toLocaleString()} of {total.toLocaleString()}{" "}
                        responses are "Accepted"
                    </Text>
                </Stack>

                <RingProgress
                    size={120}
                    thickness={12}
                    roundCaps
                    sections={[
                        {
                            value: rate,
                            color:
                                rate > 70
                                    ? "green"
                                    : rate > 40
                                      ? "orange"
                                      : "red",
                        },
                    ]}
                    label={
                        <Text ta="center" fw={700} size="xl">
                            {rate}%
                        </Text>
                    }
                />
            </Group>

            <Group mt="md" gap="xs">
                <Badge color="green" variant="light">
                    Accepted: {accepted}
                </Badge>
                <Badge color="orange" variant="light">
                    Tentative: {tentative}
                </Badge>
                <Badge color="red" variant="light">
                    Declined: {declined}
                </Badge>
            </Group>
        </Paper>
    );
};
