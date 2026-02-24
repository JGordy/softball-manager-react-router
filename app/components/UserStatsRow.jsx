import { Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconTrophy, IconBallBaseball, IconUsers } from "@tabler/icons-react";
import classes from "@/styles/userStatsRow.module.css";

export default function UserStatsRow({ stats }) {
    const items = [
        {
            label: "Teams",
            value: stats?.teamCount || 0,
            icon: <IconUsers size={20} stroke={2} />,
            color: "lime",
        },
        {
            label: "Games",
            value: stats?.gameCount || 0,
            icon: <IconBallBaseball size={20} stroke={2} />,
            color: "lime",
        },
        {
            label: "Awards",
            value: stats?.awardsCount || 0,
            icon: <IconTrophy size={20} stroke={2} />,
            color: "lime",
        },
    ];

    return (
        <Group justify="center" gap="md" mt="md" mb="sm">
            {items.map((stat, index) => (
                <Group key={index} gap="sm" className={classes.statItem}>
                    <ThemeIcon
                        variant="light"
                        color={stat.color}
                        size="md"
                        radius="sm"
                    >
                        {stat.icon}
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Text fw={900} size="md" className={classes.value}>
                            {stat.value}
                        </Text>
                        <Text className={classes.label}>{stat.label}</Text>
                    </Stack>
                </Group>
            ))}
        </Group>
    );
}
