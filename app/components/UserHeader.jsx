import { Avatar, Group, Text, Title } from '@mantine/core';

export default function UserHeader({ user, subText }) {
    const fullName = `${user.firstName} ${user.lastName}`;

    return (
        <Group my="md">
            <Avatar color="green" name={fullName} alt={fullName} size="md" />
            <div>
                <Title order={3}>{`Hello, ${user.firstName}!`}</Title>
                {subText && <Text size="0.8rem">{subText}</Text>}
            </div>
        </Group>
    );
}