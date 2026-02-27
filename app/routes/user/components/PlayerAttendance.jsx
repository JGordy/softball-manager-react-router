import { Card, Text, Center, Stack, Group, RingProgress } from "@mantine/core";
import {
    IconCalendarCheck,
    IconCheck,
    IconX,
    IconQuestionMark,
} from "@tabler/icons-react";
import DeferredLoader from "@/components/DeferredLoader";

export default function PlayerAttendance({ attendancePromise }) {
    return (
        <DeferredLoader
            resolve={attendancePromise}
            fallback={
                <Center p="xl">
                    <Text c="dimmed">Loading attendance...</Text>
                </Center>
            }
        >
            {(resolvedAttendance = []) => {
                const total = resolvedAttendance.length;

                if (!total) {
                    return (
                        <Card radius="md" mt="xs" withBorder>
                            <Text ta="center" c="dimmed" size="md">
                                No attendance records found.
                            </Text>
                        </Card>
                    );
                }

                const accepted = resolvedAttendance.filter(
                    (a) => a.status === "accepted",
                ).length;
                const declined = resolvedAttendance.filter(
                    (a) => a.status === "declined",
                ).length;
                const tentative = resolvedAttendance.filter(
                    (a) => a.status === "tentative" || a.status === "maybe",
                ).length;
                const other = total - (accepted + declined + tentative);

                const acceptedPercent =
                    Math.round((accepted / total) * 100) || 0;
                const declinedPercent =
                    Math.round((declined / total) * 100) || 0;
                const tentativePercent =
                    Math.round((tentative / total) * 100) || 0;
                const otherPercent = Math.round((other / total) * 100) || 0;

                return (
                    <Stack gap="md">
                        <Card shadow="sm" padding="lg" radius="lg" withBorder>
                            <Group justify="center" align="center" gap="xl">
                                <RingProgress
                                    size={160}
                                    thickness={16}
                                    roundCaps
                                    sections={[
                                        {
                                            value: acceptedPercent,
                                            color: "lime",
                                        },
                                        {
                                            value: declinedPercent,
                                            color: "red",
                                        },
                                        {
                                            value: tentativePercent,
                                            color: "yellow",
                                        },
                                        { value: otherPercent, color: "gray" },
                                    ]}
                                    label={
                                        <Text
                                            c="var(--mantine-color-lime-6)"
                                            fw={700}
                                            ta="center"
                                            size="xl"
                                        >
                                            {acceptedPercent}%<br />
                                            <Text
                                                span
                                                size="xs"
                                                c="dimmed"
                                                fw={500}
                                            >
                                                Acceptance
                                            </Text>
                                        </Text>
                                    }
                                />

                                <Stack gap="xs">
                                    <Group gap="xs">
                                        <IconCheck
                                            size={20}
                                            color="var(--mantine-color-lime-6)"
                                        />
                                        <Text size="sm" fw={500}>
                                            Accepted: {accepted}
                                        </Text>
                                    </Group>
                                    <Group gap="xs">
                                        <IconX
                                            size={20}
                                            color="var(--mantine-color-red-6)"
                                        />
                                        <Text size="sm" fw={500}>
                                            Declined: {declined}
                                        </Text>
                                    </Group>
                                    <Group gap="xs">
                                        <IconQuestionMark
                                            size={20}
                                            color="var(--mantine-color-yellow-6)"
                                        />
                                        <Text size="sm" fw={500}>
                                            Tentative: {tentative}
                                        </Text>
                                    </Group>
                                    {other > 0 && (
                                        <Group gap="xs">
                                            <IconCalendarCheck
                                                size={20}
                                                color="var(--mantine-color-gray-6)"
                                            />
                                            <Text size="sm" fw={500}>
                                                Other: {other}
                                            </Text>
                                        </Group>
                                    )}
                                </Stack>
                            </Group>

                            <Center mt="xl">
                                <Text size="sm" c="dimmed">
                                    Total Responses: {total}
                                </Text>
                            </Center>
                        </Card>
                    </Stack>
                );
            }}
        </DeferredLoader>
    );
}
