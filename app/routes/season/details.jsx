import { Card, Container, Divider, Group, Text, Title } from "@mantine/core";

import {
    IconCalendarRepeat,
    IconCurrencyDollar,
    IconFriends,
    IconMapPin,
} from "@tabler/icons-react";

import BackButton from "@/components/BackButton";
import GamesList from "@/components/GamesList";

import { createGames, createSingleGame } from "@/actions/games";
import { updateSeason } from "@/actions/seasons";

import { getSeasonById } from "@/loaders/seasons";
import { getParkById } from "@/loaders/parks";

import useModal from "@/hooks/useModal";
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

export default function SeasonDetails({ loaderData, actionData }) {
    const { season } = loaderData;

    console.log("/season/details.jsx: ", { loaderData });

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

    const textProps = {
        size: "md",
    };

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

            <Group justify="space-between" mb="lg">
                <Group gap="5px">
                    <IconMapPin size={18} />
                    <Text {...textProps}>
                        {season.location || "Not specified"}
                    </Text>
                </Group>

                <Group gap="5px">
                    <IconCalendarRepeat size={18} />
                    <Text {...textProps}>{`${season.gameDays}s`}</Text>
                </Group>

                <Group gap="5px">
                    <IconFriends size={18} />
                    <Text {...textProps}>{season.leagueType}</Text>
                </Group>

                <Group gap="5px">
                    <IconCurrencyDollar size={18} />
                    <Text {...textProps}>
                        {`${season.signUpFee || "TBD"}/player`}
                    </Text>
                </Group>
            </Group>

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

            <GamesList games={season.games} />
        </Container>
    );
}
