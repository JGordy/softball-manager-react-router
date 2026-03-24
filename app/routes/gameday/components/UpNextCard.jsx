import { Card, Group, Text, Badge } from "@mantine/core";
import { getActivePlayerInSlot } from "../utils/gamedayUtils";

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
                    {upcomingBatters.map((slot, index) => {
                        const isFirst = index === 0;
                        const activePlayer = getActivePlayerInSlot(slot);
                        const isSub = !!slot.substitutions?.length;
                        const lastInitial = activePlayer.lastName
                            ? `${activePlayer.lastName.charAt(0)}.`
                            : "";
                        const name =
                            `${activePlayer.firstName} ${lastInitial}`.trim();
                        return (
                            <span key={`${slot.$id}`}>
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
                                {isSub && (
                                    <Badge
                                        component="span"
                                        size="xs"
                                        color="orange"
                                        variant="light"
                                        ml={4}
                                    >
                                        SUB
                                    </Badge>
                                )}
                            </span>
                        );
                    })}
                </Text>
            </Group>
        </Card>
    );
}
