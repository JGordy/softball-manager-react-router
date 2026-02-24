import { Card, Group, Text } from "@mantine/core";

import { IconChevronRight } from "@tabler/icons-react";

export default function CardSection({
    onClick,
    heading,
    subHeading,
    leftSection,
    rightSection = <IconChevronRight size={18} />,
}) {
    return (
        <Card.Section my="xs" inheritPadding>
            <Group justify="space-between" c="lime" onClick={onClick}>
                <Group gap="xs" c="lime">
                    {leftSection}
                    <Text>{heading}</Text>
                </Group>
                {rightSection}
            </Group>
            {subHeading}
        </Card.Section>
    );
}
