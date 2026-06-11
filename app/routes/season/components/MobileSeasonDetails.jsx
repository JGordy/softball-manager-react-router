import { useMemo } from "react";
import {
    Card,
    Container,
    Group,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";

import {
    IconBallBaseball,
    IconInfoCircle,
    IconTable,
    IconMap2,
} from "@tabler/icons-react";

import BackButton from "@/components/BackButton";
import GamesList from "@/components/GamesList";
import TabsWrapper from "@/components/TabsWrapper";
import BoxScore from "@/components/BoxScore";
import ContactSprayChart from "@/components/ContactSprayChart";

import { formatForViewerDate } from "@/utils/dateTime";

import SeasonMenu from "./SeasonMenu";

function DetailCard({ icon: Icon, label, value, color, href, rightSection }) {
    const isLink = !!href;
    const Component = isLink ? "a" : "div";

    return (
        <Card
            radius="md"
            component={Component}
            href={href}
            target={isLink ? "_blank" : undefined}
            rel={isLink ? "noopener noreferrer" : undefined}
        >
            <Group>
                <ThemeIcon size="xl" radius="xl" variant="filled" color={color}>
                    <Icon />
                </ThemeIcon>
                <div>
                    <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                        {label}
                    </Text>
                    <Text fw={500} size="lg">
                        {value}
                    </Text>
                </div>
                {rightSection}
            </Group>
        </Card>
    );
}

/**
 * Renders the mobile version of the Season Details page.
 * Displays a tabs interface with Details, Games, Stats, and Spray Chart.
 */
export default function MobileSeasonDetails({
    season,
    primaryColor,
    isManager,
    record,
    detailsConfig,
    players = [],
    logs = [],
}) {
    const battersList = useMemo(() => {
        return (players || []).map((p) => ({
            label: p.jerseyNumber
                ? `#${p.jerseyNumber} ${p.firstName} ${p.lastName || ""}`
                : `${p.firstName} ${p.lastName || ""}`,
            value: p.$id,
        }));
    }, [players]);

    return (
        <Container pt="md">
            <Group justify="space-between">
                <BackButton text="Team Details" to={`/team/${season.teamId}`} />
                {isManager && <SeasonMenu season={season} />}
            </Group>

            <Title order={2} align="center" mt="lg">
                {season.seasonName}
            </Title>

            <Text ta="center" c="dimmed" mt="sm" mb="lg">
                {formatForViewerDate(season.startDate)} -{" "}
                {formatForViewerDate(season.endDate)}
            </Text>

            <TabsWrapper defaultValue="details" color={primaryColor}>
                <Tabs.Tab value="details">
                    <Group gap="xs" align="center" justify="center">
                        <IconInfoCircle size={16} />
                        Details
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="games">
                    <Group gap="xs" align="center" justify="center">
                        <IconBallBaseball size={16} />
                        Games
                    </Group>
                </Tabs.Tab>
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

                <Tabs.Panel value="details" pt="md">
                    <Stack gap="sm" pt="md">
                        {detailsConfig.map((detail) => (
                            <DetailCard
                                key={detail.label}
                                {...detail}
                                color={primaryColor}
                            />
                        ))}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="games" pt="md">
                    <Title order={4} mb="sm">
                        <Group justify="space-between">
                            Games ({season.games.length || "0"})
                            {record && (
                                <div>
                                    Record {record?.wins}-{record?.losses}-
                                    {record?.ties}
                                </div>
                            )}
                        </Group>
                    </Title>

                    <GamesList
                        games={season.games}
                        height="50vh"
                        primaryColor={primaryColor}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="stats" pt="md">
                    <BoxScore logs={logs} players={players} seasonView={true} />
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
        </Container>
    );
}
