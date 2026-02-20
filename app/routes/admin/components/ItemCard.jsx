import { Card, Group, Text } from "@mantine/core";

export const ItemCard = ({ text, subText, rightSection, bgColor }) => (
    <Card
        withBorder
        p="xs"
        radius="sm"
        style={
            bgColor
                ? {
                      backgroundColor: bgColor,
                      borderColor: "rgba(0,0,0,0.1)",
                  }
                : undefined
        }
    >
        <Group justify="space-between" wrap="nowrap">
            <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                    size="sm"
                    fw={bgColor ? 700 : 500}
                    truncate
                    c={bgColor ? "white" : undefined}
                    style={
                        bgColor
                            ? { textShadow: "0 1px 2px rgba(0,0,0,0.3)" }
                            : undefined
                    }
                >
                    {text}
                </Text>
                {subText && (
                    <Text
                        size="xs"
                        c={bgColor ? "white" : "dimmed"}
                        opacity={bgColor ? 0.8 : 1}
                        truncate
                        mb={4}
                    >
                        {subText}
                    </Text>
                )}
            </div>
            {rightSection}
        </Group>
    </Card>
);
