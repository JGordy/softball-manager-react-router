import { Card, Group, Text } from "@mantine/core";

export default function UpNextCard({ upcomingBatters = [], ...props }) {
    if (!upcomingBatters || upcomingBatters.length === 0) return null;

    return (
        <Card
            withBorder
            p="xs"
            radius="md"
            bg="var(--mantine-color-body)"
            {...props}
        >
            <Group justify="space-between" gap="sm" wrap="nowrap">
                <Group
                    gap="xs"
                    align="center"
                    wrap="nowrap"
                    style={{ flexShrink: 0 }}
                >
                    <Text size="xs" fw={700} c="dimmed">
                        UP NEXT
                    </Text>
                    <Text size="xs" c="var(--mantine-color-default-border)">
                        |
                    </Text>
                </Group>

                <Text
                    ta="right"
                    size="sm"
                    truncate="end"
                    style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        flex: 1,
                    }}
                >
                    {upcomingBatters.map((batter, index) => {
                        const isFirst = index === 0;
                        const lastInitial = batter.lastName
                            ? `${batter.lastName.charAt(0)}.`
                            : "";
                        const name =
                            `${batter.firstName} ${lastInitial}`.trim();
                        return (
                            <span key={`${batter.$id}`}>
                                {index > 0 && (
                                    <Text
                                        component="span"
                                        c="dimmed"
                                        mx={8}
                                        fz="xs"
                                    >
                                        •
                                    </Text>
                                )}
                                <Text
                                    component="span"
                                    fw={isFirst ? 700 : 400}
                                    c={isFirst ? undefined : "dimmed"}
                                >
                                    {name}
                                </Text>
                            </span>
                        );
                    })}
                </Text>
            </Group>
        </Card>
    );
}
