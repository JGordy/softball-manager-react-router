import { Card, Group, Text } from '@mantine/core';

import { IconChevronRight } from '@tabler/icons-react';


export default function CardSection({
    onClick,
    heading,
    subHeading,
    leftSection,
    rightSection = <IconChevronRight size={18} />,
}) {

    return (
        <Card.Section my="xs" inheritPadding>
            <Group justify="space-between" c="green" onClick={onClick}>
                <Group gap="xs" c="green">
                    {leftSection}
                    <Text>{heading}</Text>
                </Group>
                {rightSection}
            </Group>
            {subHeading}
        </Card.Section>
    );
}