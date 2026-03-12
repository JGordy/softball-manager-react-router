import { Box, Divider, Group, Text } from "@mantine/core";

export default function PreferenceSection({
    icon: Icon,
    label,
    description,
    children,
    showDivider = true,
}) {
    return (
        <>
            <Box px="xs">
                <Group gap="xs" mb={4}>
                    {Icon && <Icon size={16} />}
                    <Text size="sm" fw={500}>
                        {label}
                    </Text>
                </Group>
                {description && (
                    <Text size="xs" c="dimmed" mb="md">
                        {description}
                    </Text>
                )}
                {children}
            </Box>
            {showDivider && <Divider variant="dashed" />}
        </>
    );
}
