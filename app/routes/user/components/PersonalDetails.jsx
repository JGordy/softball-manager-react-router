import {
    Avatar,
    Card,
    Divider,
    Group,
    List,
    Stack,
    Text,
    Title,
} from "@mantine/core";

export default function DetailCard({ editButton, player, fieldsToDisplay }) {

    return (
        <Card shadow="sm" padding="lg" radius="xl" withBorder>
            <Group justify="space-between">
                <Group>
                    <Title order={4}>Personal Details</Title>
                </Group>
                {editButton}
            </Group>

            <Divider my="xs" size="sm" />

            <List
                spacing="xs"
                size="sm"
                center
            >
                {Object.entries(fieldsToDisplay).map(([key, { icon, label }]) => {
                    const value = player[key];
                    return (
                        <List.Item key={key} icon={icon}>
                            <Text size="sm" c={!value ? 'red' : ''}>
                                {value || `${label} not listed*`}
                            </Text>
                        </List.Item>
                    );
                })}
            </List>
        </Card>
    );
};