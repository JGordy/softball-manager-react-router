import { useMemo } from "react";
import {
    Badge,
    Container,
    Grid,
    Group,
    Paper,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";

import {
    IconBallBaseball,
    IconCalendarMonth,
    IconInfoCircle,
    IconTable,
    IconMap2,
} from "@tabler/icons-react";

import BackButton from "@/components/BackButton";
import GamesList from "@/components/GamesList";
import BoxScore from "@/components/BoxScore";
import ContactSprayChart from "@/components/ContactSprayChart";
import TabsWrapper from "@/components/TabsWrapper";

import { splitGames } from "@/utils/getGames";
import { formatForViewerDate } from "@/utils/dateTime";

import SeasonMenu from "./SeasonMenu";

/**
 * Renders the desktop version of the Season Details page.
 * Displays a three-column layout: Season Info, Game Tabs (Upcoming / Past),
 * and Stats Tabs (Roster Stats / Season Spray Chart).
 */
export default function DesktopSeasonDetails({
    season,
    primaryColor,
    isManager,
    record,
    detailsConfig,
    players = [],
    teamPlayers = [],
    logs = [],
    isArchiveView = false,
}) {
    const { futureGames: upcomingGames, pastGames } = splitGames(season.games);

    const hasGames = season?.games?.length > 0;

    const battersList = useMemo(() => {
        return (players || []).map((p) => ({
            label: p.jerseyNumber
                ? `#${p.jerseyNumber} ${p.firstName} ${p.lastName || ""}`
                : `${p.firstName} ${p.lastName || ""}`,
            value: p.$id,
        }));
    }, [players]);

    return (
        <Container size="xl" pt="md">
            <Group justify="space-between">
                {!isArchiveView ? (
                    <BackButton
                        text="Team Details"
                        to={`/team/${season.teamId}`}
                    />
                ) : (
                    <Badge color="blue" variant="light" size="lg">
                        Historical Archive View
                    </Badge>
                )}
                {isManager && (
                    <SeasonMenu
                        season={season}
                        players={players}
                        teamPlayers={teamPlayers}
                        isManager={isManager}
                    />
                )}
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

            <Grid gap="xl">
                {/* Column 1: Info */}
                <Grid.Col span={{ base: 12, lg: 3 }}>
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

                {/* Column 2: Games Tabs */}
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                    <TabsWrapper defaultValue="upcoming" color={primaryColor}>
                        <Tabs.Tab value="upcoming">
                            <Group gap="xs" align="center" justify="center">
                                <IconCalendarMonth size={16} />
                                Upcoming ({upcomingGames.length})
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="past">
                            <Group gap="xs" align="center" justify="center">
                                <IconBallBaseball size={16} />
                                Past ({pastGames.length})
                            </Group>
                        </Tabs.Tab>

                        <Tabs.Panel value="upcoming" pt="md">
                            <GamesList
                                games={upcomingGames}
                                height="calc(100vh - 290px)"
                                primaryColor={primaryColor}
                            />
                        </Tabs.Panel>
                        <Tabs.Panel value="past" pt="md">
                            <GamesList
                                games={pastGames}
                                height="calc(100vh - 290px)"
                                primaryColor={primaryColor}
                            />
                        </Tabs.Panel>
                    </TabsWrapper>
                </Grid.Col>

                {/* Column 3: Stats Tabs */}
                <Grid.Col span={{ base: 12, md: 6, lg: 5 }}>
                    <TabsWrapper defaultValue="stats" color={primaryColor}>
                        <Tabs.Tab value="stats">
                            <Group gap="xs" align="center" justify="center">
                                <IconTable size={16} />
                                Stats
                            </Group>
                        </Tabs.Tab>
                        <Tabs.Tab value="spray">
                            <Group gap="xs" align="center" justify="center">
                                <IconMap2 size={16} />
                                Spray
                            </Group>
                        </Tabs.Tab>

                        <Tabs.Panel value="stats" pt="md">
                            {players.length === 0 ? (
                                <Paper
                                    p="lg"
                                    radius="md"
                                    withBorder
                                    style={{ textAlign: "center" }}
                                >
                                    <Text fw={500} size="lg" mb="xs">
                                        Roster is Empty
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {isManager
                                            ? "Add players to this season using the 'Manage Roster' option in the Season Menu."
                                            : "No roster has been configured for this season yet."}
                                    </Text>
                                </Paper>
                            ) : (
                                <BoxScore
                                    logs={logs}
                                    players={players}
                                    seasonView={true}
                                />
                            )}
                        </Tabs.Panel>
                        <Tabs.Panel value="spray" pt="md">
                            <ContactSprayChart
                                hits={logs}
                                batters={battersList}
                                layout="stacked"
                                games={season.games}
                            />
                        </Tabs.Panel>
                    </TabsWrapper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
