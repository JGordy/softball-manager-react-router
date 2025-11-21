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
    IconCalendarRepeat,
    IconCurrencyDollar,
    IconExternalLink,
    IconFriends,
    IconInfoCircle,
    IconMapPin,
} from "@tabler/icons-react";

import BackButton from "@/components/BackButton";
import GamesList from "@/components/GamesList";
import TabsWrapper from "@/components/TabsWrapper";

import { createGames, createSingleGame } from "@/actions/games";
import { updateSeason } from "@/actions/seasons";

import { getSeasonById } from "@/loaders/seasons";
import { getParkById } from "@/loaders/parks";

import { useResponseNotification } from "@/utils/showNotification";
import { formatForViewerDate } from "@/utils/dateTime";

import SeasonMenu from "./components/SeasonMenu";

export async function loader({ params }) {
    const { seasonId } = params;

    let park = null;
    const { season } = await getSeasonById({ seasonId });

    if (season.parkId) {
        park = await getParkById({ parkId: season.parkId });
    }

    return { season, park };
}

export async function action({ request, params }) {
    const { seasonId } = params;

    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "edit-season") {
        return updateSeason({ values, seasonId });
    }

    if (_action === "add-games") {
        return createGames({ values, seasonId });
    }

    if (_action === "add-single-game") {
        return createSingleGame({ values });
    }
}

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

export default function SeasonDetails({ loaderData, actionData }) {
    const { season, park } = loaderData;
    const { teams } = season;
    const [team] = teams;
    const { primaryColor } = team;

    // console.log("/season/details.jsx: ", { loaderData });

    useResponseNotification(actionData);

    const hasGames = season?.games?.length > 0;

    const record =
        hasGames &&
        season.games.reduce(
            (acc, game) => {
                if (game.result) {
                    const { score, opponentScore } = game;
                    const scoreFor = Number(score) || 0;
                    const scoreAgainst = Number(opponentScore) || 0;

                    acc.wins += scoreFor > scoreAgainst ? 1 : 0;
                    acc.losses += scoreFor < scoreAgainst ? 1 : 0;
                    acc.ties += scoreFor === scoreAgainst ? 1 : 0;
                }
                return acc;
            },
            { wins: 0, losses: 0, ties: 0 },
        );

    const detailsConfig = [
        {
            icon: IconMapPin,
            label: "Location",
            value: season.location || "Not specified",
            href: park?.googleMapsURI,
            rightSection: park?.googleMapsURI && (
                <Group gap={5} style={{ marginLeft: "auto" }}>
                    <Text size="xs" fw={700} tt="uppercase">
                        View Map
                    </Text>
                    <IconExternalLink size={16} />
                </Group>
            ),
        },
        {
            icon: IconCalendarRepeat,
            label: "Game Days",
            value: `${season.gameDays}s`,
        },
        {
            icon: IconFriends,
            label: "League Type",
            value: season.leagueType,
        },
        {
            icon: IconCurrencyDollar,
            label: "Sign Up Fee",
            value: `${season.signUpFee || "TBD"}/player`,
        },
    ];

    return (
        <Container pt="md">
            <Group justify="space-between">
                <BackButton text="Team Details" to={`/team/${season.teamId}`} />
                <SeasonMenu season={season} />
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

                    <GamesList games={season.games} height="50vh" />
                </Tabs.Panel>
            </TabsWrapper>
        </Container>
    );
}
