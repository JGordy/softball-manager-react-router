import { Group, Text, Title, Container, Button } from "@mantine/core";
import {
    IconCalendarRepeat,
    IconCurrencyDollar,
    IconExternalLink,
    IconFriends,
    IconMapPin,
} from "@tabler/icons-react";

import { useOutletContext, Link } from "react-router";

import { createGames, createSingleGame, deleteGames } from "@/actions/games";
import { updateSeason } from "@/actions/seasons";

import { getSeasonById } from "@/loaders/seasons";
import { getParkById } from "@/loaders/parks";

import { useResponseNotification } from "@/utils/showNotification";
import { appwriteClientContext } from "@/contexts/router";

import DesktopSeasonDetails from "./components/DesktopSeasonDetails";
import MobileSeasonDetails from "./components/MobileSeasonDetails";

export function meta({ data, loaderData }) {
    const routeData = loaderData || data;
    if (!routeData || !routeData.season) return [];
    const { season } = routeData;
    const team = season.teams?.[0] || {};
    const teamName = team.name || "Our Team";
    const title = `${season.seasonName || "Season Details"} - ${teamName} | RostrHQ`;
    const description = `View stats, schedules, rosters, and details for the ${season.seasonName || "softball"} season of ${teamName}.`;

    return [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: "/android-chrome-icon-512x512.png" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "/android-chrome-icon-512x512.png" },
    ];
}

export async function loader({ request, params, context }) {
    const { seasonId } = params;
    const { isBotUserAgent } = await import("@/utils/device");
    const isBot = isBotUserAgent(request);

    let client = context.get(appwriteClientContext);
    if ((isBot || !client) && seasonId) {
        const { createAdminClient } = await import("@/utils/appwrite/server");
        client = createAdminClient();
    }

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
        let playerIds = [];
        try {
            playerIds = values.playerIds ? JSON.parse(values.playerIds) : [];
            if (!Array.isArray(playerIds)) {
                throw new Error("playerIds must be an array");
            }
        } catch {
            return { success: false, message: "Invalid playerIds format" };
        }

        try {
            const { getSeasonById } = await import("@/loaders/seasons");
            const { season } = await getSeasonById({ seasonId, client });
            if (!season || !season.teamId) {
                return { success: false, message: "Season not found" };
            }

            const { getTeamById } = await import("@/loaders/teams");
            const { managerIds } = await getTeamById({
                teamId: season.teamId,
                client,
            });

            const { account } = client;
            const currentUser = await account.get();
            const userId = currentUser?.$id;

            if (!userId || !managerIds.includes(userId)) {
                return {
                    success: false,
                    message:
                        "Unauthorized: You do not have permission to manage this roster.",
                };
            }

            const { updateSeasonRoster } = await import(
                "@/actions/rosterHistory"
            );
            return updateSeasonRoster({
                playerIds,
                teamId: season.teamId,
                seasonId,
                client,
            });
        } catch (err) {
            return {
                success: false,
                message: err.message || "Failed to update roster",
            };
        }
    }
}

export default function SeasonDetails({ loaderData, actionData }) {
    const { isDesktop, user, isAuthenticated } = useOutletContext();

    useResponseNotification(actionData);

    if (isAuthenticated === false) {
        return (
            <Container size="sm" py="xl" ta="center">
                <Title order={2} mb="md">
                    Private Season Page
                </Title>
                <Text size="lg" c="dimmed" mb="xl">
                    You must be logged in to view this season's details.
                </Text>
                <Button
                    component={Link}
                    to="/login"
                    variant="filled"
                    color="lime"
                >
                    Log In
                </Button>
            </Container>
        );
    }

    const { season, park, players, teamPlayers, logs, isArchiveView } =
        loaderData;
    const { teams = [] } = season || {};
    const [team] = teams;
    const { primaryColor, managerIds = [] } = team || { primaryColor: "lime" };

    const isManager = !isArchiveView && managerIds.includes(user?.$id);

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
