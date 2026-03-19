import { Container, Group, Text } from "@mantine/core";

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

import DesktopSeasonDetails from "./components/DesktopSeasonDetails";
import MobileSeasonDetails from "./components/MobileSeasonDetails";

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
        return createGames({ values });
    }

    if (_action === "delete-games") {
        return deleteGames({ values, request });
    }

    if (_action === "add-single-game") {
        return createSingleGame({ values });
    }
}

export default function SeasonDetails({ loaderData, actionData }) {
    const { isDesktop, user } = useOutletContext();
    const { season, park } = loaderData;
    const { teams = [] } = season;
    const [team] = teams;
    const { primaryColor, managerIds = [] } = team || { primaryColor: "lime" };

    const isManager = managerIds.includes(user?.$id);

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
    };

    if (isDesktop) {
        return <DesktopSeasonDetails {...sharedProps} />;
    }

    return <MobileSeasonDetails {...sharedProps} />;
}
