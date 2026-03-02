import { Group, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function InlineError({
    message = "Error loading data",
    ...props
}) {
    return (
        <Group gap="xs" {...props} c="red" wrap="nowrap">
            <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
            <Text size="xs" lh={1.2}>
                {message}
            </Text>
        </Group>
    );
}
