import {
    Badge,
    Container,
    Grid,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";

import {
    IconBallBaseball,
    IconCalendarMonth,
    IconInfoCircle,
} from "@tabler/icons-react";

import BackButton from "@/components/BackButton";
import GamesList from "@/components/GamesList";

import { splitGames } from "@/utils/getGames";
import { formatForViewerDate } from "@/utils/dateTime";

import SeasonMenu from "./SeasonMenu";

export default function DesktopSeasonDetails({
    season,
    primaryColor,
    record,
    detailsConfig,
}) {
    const { futureGames: upcomingGames, pastGames } = splitGames(season.games);

    const hasGames = season?.games?.length > 0;

    return (
        <Container size="xl" pt="md">
            <Group justify="space-between">
                <BackButton text="Team Details" to={`/team/${season.teamId}`} />
                <SeasonMenu season={season} />
            </Group>

            <Group justify="space-between" align="flex-end" mb="xl" mt="lg">
                <Group align="flex-end">
                    <Title order={2}>{season.seasonName}</Title>
                    <Text c="dimmed" size="lg" mb={4}>
                        {formatForViewerDate(season.startDate)} -{" "}
                        {formatForViewerDate(season.endDate)}
                    </Text>
                </Group>
                {record && hasGames && (
                    <Badge
                        color={primaryColor}
                        size="xl"
                        variant="filled"
                        mb={4}
                    >
                        Record: {record.wins}-{record.losses}-{record.ties}
                    </Badge>
                )}
            </Group>

            <Grid gutter="xl">
                {/* Left Column: Details */}
                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Group gap="sm" align="center" mb="md">
                        <ThemeIcon
                            size="md"
                            radius="md"
                            variant="filled"
                            color={primaryColor}
                        >
                            <IconInfoCircle size={16} />
                        </ThemeIcon>
                        <Title order={3} size="h4">
                            Season Info
                        </Title>
                    </Group>
                    <Paper
                        withBorder
                        p="lg"
                        radius="md"
                        style={{
                            borderTop: `4px solid ${primaryColor}`,
                            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.05)`,
                        }}
                    >
                        <Stack gap="lg">
                            {detailsConfig.map((detail) => {
                                const {
                                    icon: Icon,
                                    label,
                                    value,
                                    href,
                                    rightSection,
                                } = detail;
                                const isLink = !!href;
                                const Component = isLink ? "a" : "div";

                                return (
                                    <Group
                                        key={label}
                                        wrap="nowrap"
                                        component={Component}
                                        href={href}
                                        target={isLink ? "_blank" : undefined}
                                        rel={
                                            isLink
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        style={{
                                            textDecoration: "none",
                                            color: "inherit",
                                        }}
                                    >
                                        <ThemeIcon
                                            size="xl"
                                            radius="md"
                                            variant="filled"
                                            color={primaryColor}
                                        >
                                            <Icon />
                                        </ThemeIcon>
                                        <div style={{ flex: 1 }}>
                                            <Text
                                                c="dimmed"
                                                size="sm"
                                                tt="uppercase"
                                                fw={700}
                                            >
                                                {label}
                                            </Text>
                                            <Text fw={500}>{value}</Text>
                                        </div>
                                        {rightSection}
                                    </Group>
                                );
                            })}
                        </Stack>
                    </Paper>
                </Grid.Col>

                {/* Middle Column: Upcoming Games */}
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                    <Group gap="sm" align="center" mb="md">
                        <ThemeIcon
                            size="md"
                            radius="md"
                            variant="filled"
                            color={primaryColor}
                        >
                            <IconCalendarMonth size={16} />
                        </ThemeIcon>
                        <Title order={3} size="h4">
                            Upcoming
                        </Title>
                        <Text size="sm" c="dimmed" fw={500}>
                            ({upcomingGames.length})
                        </Text>
                    </Group>
                    <GamesList
                        games={upcomingGames}
                        height="calc(100vh - 250px)"
                    />
                </Grid.Col>

                {/* Right Column: Past Games */}
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                    <Group gap="sm" align="center" mb="md">
                        <ThemeIcon
                            size="md"
                            radius="md"
                            variant="filled"
                            color={primaryColor}
                        >
                            <IconBallBaseball size={16} />
                        </ThemeIcon>
                        <Title order={3} size="h4">
                            Past
                        </Title>
                        <Text size="sm" c="dimmed" fw={500}>
                            ({pastGames.length})
                        </Text>
                    </Group>
                    <GamesList games={pastGames} height="calc(100vh - 250px)" />
                </Grid.Col>
            </Grid>
        </Container>
    );
}
