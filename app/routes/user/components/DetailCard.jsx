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
    const { firstName, lastName, gender, bats, ...rest } = player;
    const fullName = `${firstName} ${lastName}`;

    return (
        <Card shadow="sm" padding="lg" radius="xl" withBorder>
            <Group justify="space-between">
                <Group>
                    <Avatar color="green" name={fullName} alt={fullName} size="sm" />
                    <Title order={4}>{fullName}</Title>
                </Group>
                {editButton}
            </Group>

            <Divider my="xs" size="sm" />

            <Group justify="space-around" gap="0px">
                <Stack align="center" gap="0px">
                    <Text size="xs">Gender</Text>
                    <Text size="small" c="green" fw={700} autoContrast>{gender}</Text>
                </Stack>


                <Divider orientation="vertical" size="sm" />

                <Stack align="center" gap="0px">
                    <Text size="xs">Batting</Text>
                    <Text size="small" c="green" fw={700} autoContrast>{bats}</Text>
                </Stack>
            </Group>

            <Divider my="xs" size="sm" />

            <List
                spacing="xs"
                size="sm"
                center
            >
                {Object.entries(fieldsToDisplay).map(([key, { icon, label }]) => {
                    const value = rest[key];
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