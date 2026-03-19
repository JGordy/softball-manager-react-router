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

import { IconBallBaseball, IconInfoCircle } from "@tabler/icons-react";

import BackButton from "@/components/BackButton";
import GamesList from "@/components/GamesList";
import TabsWrapper from "@/components/TabsWrapper";

import { formatForViewerDate } from "@/utils/dateTime";

import SeasonMenu from "./SeasonMenu";

function DetailCard({ icon: Icon, label, value, color, href, rightSection }) {
    const isLink = !!href;
    const Component = isLink ? "a" : "div";

    return (
        <Card
            withBorder
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

export default function MobileSeasonDetails({
    season,
    primaryColor,
    isManager,
    record,
    detailsConfig,
}) {
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
            </TabsWrapper>
        </Container>
    );
}
