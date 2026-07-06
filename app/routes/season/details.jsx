import { Group, Text } from "@mantine/core";
import {
    IconCalendarRepeat,
    IconCurrencyDollar,
    IconExternalLink,
    IconFriends,
    IconMapPin,
} from "@tabler/icons-react";

import { useOutletContext } from "react-router";

import { createGames, createSingleGame, deleteGames } from "@/actions/games";
import { updateSeason } from "@/actions/seasons";

import { getSeasonById } from "@/loaders/seasons";
import { getParkById } from "@/loaders/parks";

import { useResponseNotification } from "@/utils/showNotification";
import { appwriteClientContext } from "@/contexts/router";

import DesktopSeasonDetails from "./components/DesktopSeasonDetails";
import MobileSeasonDetails from "./components/MobileSeasonDetails";

export async function loader({ params, context }) {
    const { seasonId } = params;
    const client = context.get(appwriteClientContext);

    let park = null;
    const { season, players, teamPlayers, logs, isArchiveView } =
        await getSeasonById({ seasonId, client });

    if (season.parkId) {
        park = await getParkById({
            parkId: season.parkId,
            client,
        });
    }

    return { season, park, players, teamPlayers, logs, isArchiveView };
}

export async function action({ request, params, context }) {
    const { seasonId } = params;

    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    const client = context.get(appwriteClientContext);

    if (_action === "edit-season") {
        return updateSeason({ values, seasonId, client });
    }

    if (_action === "add-games") {
        return createGames({ values, client });
    }

    if (_action === "delete-games") {
        return deleteGames({ values, client });
    }

    if (_action === "add-single-game") {
        return createSingleGame({ values, client });
    }

    if (_action === "update-season-roster") {
        const { updateSeasonRoster } = await import("@/actions/rosterHistory");
        const playerIds = values.playerIds ? JSON.parse(values.playerIds) : [];
        const { teamId } = values;
        return updateSeasonRoster({ playerIds, teamId, seasonId, client });
    }
}

export default function SeasonDetails({ loaderData, actionData }) {
    const { isDesktop, user } = useOutletContext();
    const { season, park, players, teamPlayers, logs, isArchiveView } =
        loaderData;
    const { teams = [] } = season;
    const [team] = teams;
    const { primaryColor, managerIds = [] } = team || { primaryColor: "lime" };

    const isManager = !isArchiveView && managerIds.includes(user?.$id);

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

    const sharedProps = {
        season,
        primaryColor,
        isManager,
        record,
        detailsConfig,
        players,
        teamPlayers,
        logs,
        isArchiveView,
    };

    if (isDesktop) {
        return <DesktopSeasonDetails {...sharedProps} />;
    }

    return <MobileSeasonDetails {...sharedProps} />;
}
