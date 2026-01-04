import { Card, Stack, Text, Button } from "@mantine/core";
import { IconRotateDot } from "@tabler/icons-react";

export default function LastPlayCard({ lastLog, onUndo, isSubmitting }) {
    return (
        <Card withBorder p="sm" radius="md" mt="auto" w="100%">
            <Stack gap={4}>
                <Text size="xs" fw={700} c="dimmed">
                    LAST PLAY
                </Text>
                <Text
                    size="xs"
                    fw={600}
                    lineClamp={3}
                    style={{ lineHeight: 1.3 }}
                >
                    {lastLog.description}
                </Text>
                <Button
                    variant="light"
                    size="compact-xs"
                    color="red"
                    mt={5}
                    leftSection={<IconRotateDot size={12} />}
                    onClick={onUndo}
                    loading={isSubmitting}
                    fullWidth
                >
                    Undo
                </Button>
            </Stack>
        </Card>
    );
}
