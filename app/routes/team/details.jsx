import { useOutletContext, redirect, Link } from "react-router";
import {
    Alert,
    Box,
    Container,
    Group,
    Text,
    Title,
    Button,
} from "@mantine/core";

import images from "@/constants/images";

import BackButton from "@/components/BackButton";

import { createSingleGame } from "@/actions/games";
import { createPlayer } from "@/actions/users";
import { createSeason } from "@/actions/seasons";
import {
    updateTeam,
    updateMemberRole,
    updatePreferences,
    updateBulkJerseyNumbers,
    removePlayersFromTeam,
    updatePlayerLabels,
    archiveTeam,
    removeTeam,
} from "@/actions/teams";
import {
    invitePlayersServer,
    syncInvitedPlayersServer,
} from "@/actions/invitations";

import { getTeamById } from "@/loaders/teams";

import { useResponseNotification } from "@/utils/showNotification";

import TeamMenu from "./components/TeamMenu";
import MobileTeamDetails from "./components/MobileTeamDetails";
import DesktopTeamDetails from "./components/DesktopTeamDetails";
import OnboardingTour from "@/components/OnboardingTour";
import { appwriteClientContext } from "@/contexts/router";
import { getTeamDetailsSteps } from "./utils/onboardingSteps";

export function links() {
    const { fieldSrc } = images;
    return [{ rel: "preload", href: fieldSrc, as: "image" }];
}

export function meta({ data, loaderData }) {
    const routeData = loaderData || data;
    if (!routeData || !routeData.teamData) return [];
    const { teamData } = routeData;
    const title = `${teamData.name || "Team Details"} | RostrHQ`;
    const description = `View stats, schedules, rosters, and details for ${teamData.name || "softball team"}.`;

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
    const { teamId } = params;
    const { isBotUserAgent } = await import("@/utils/device");
    const isBot = isBotUserAgent(request);

    let client = context.get(appwriteClientContext);
    if ((isBot || !client) && teamId) {
        const { createAdminClient } = await import("@/utils/appwrite/server");
        client = createAdminClient();
    }

    return getTeamById({ teamId, client });
}

export async function action({ request, params, context }) {
    const { teamId } = params;
    const contentType =
        request.headers && typeof request.headers.get === "function"
            ? request.headers.get("Content-Type")
            : undefined;
    let _action, values, formData;

    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await request.json();
        const url = new URL(request.url);
        _action = data._action || url.searchParams.get("_action");
        const { _action: _ignored, ...sanitizedValues } = data;
        values = sanitizedValues;
    } else {
        formData = await request.formData();
        const data = Object.fromEntries(formData);
        _action = data._action;
        const { _action: _ignored, ...sanitizedValues } = data;
        values = sanitizedValues;
    }

    const client = context.get(appwriteClientContext);

    if (_action === "add-player") {
        return createPlayer({ values, teamId, client });
    }

    if (_action === "update-preferences") {
        return updatePreferences({
            teamId,
            prefs: {
                maxMaleBatters: values.maxMaleBatters,
                lineupStrategy: values.lineupStrategy,
            },
        });
    }

    if (_action === "update-player-labels") {
        return updatePlayerLabels({ teamId, values, client });
    }

    if (_action === "invite-player") {
        const emails = formData.getAll("email");
        const names = formData.getAll("name");

        const players = emails
            .map((email, index) => ({
                email: (email || "").trim(),
                name: (names[index] || "").trim(),
            }))
            .filter((player) => player.email !== "");

        const url = new URL(request.url);
        const inviteUrl = `${url.origin}/team/${teamId}/accept-invite`;

        return invitePlayersServer({
            players,
            teamId,
            url: inviteUrl,
            client,
        });
    }

    if (_action === "invite-player-sync") {
        if (values.error) {
            return {
                success: false,
                message: values.error,
            };
        }

        const players =
            typeof values.players === "string"
                ? JSON.parse(values.players)
                : values.players;

        return syncInvitedPlayersServer({
            players,
            teamId,
        });
    }

    if (_action === "add-season") {
        return createSeason({ values, teamId, client });
    }

    if (_action === "edit-team") {
        return updateTeam({ values, teamId, client });
    }

    if (_action === "add-single-game") {
        return createSingleGame({ values, teamId, client });
    }

    if (_action === "update-role") {
        return updateMemberRole({ values, teamId, client });
    }

    if (_action === "update-bulk-jersey-numbers") {
        return updateBulkJerseyNumbers({ teamId, values, client });
    }

    if (_action === "archive-team") {
        const result = await archiveTeam({ teamId, client });
        if (result.success) return redirect("/dashboard");
        return result;
    }

    if (_action === "delete-team") {
        const result = await removeTeam({ teamId, client });
        if (result.success) return redirect("/dashboard");
        return result;
    }

    if (_action === "remove-players") {
        let membershipIds = [];
        try {
            membershipIds =
                typeof values.membershipIds === "string"
                    ? JSON.parse(values.membershipIds)
                    : values.membershipIds || [];
            if (!Array.isArray(membershipIds)) {
                throw new Error("membershipIds must be an array");
            }
        } catch {
            return { success: false, message: "Invalid membershipIds format" };
        }
        return removePlayersFromTeam({ teamId, membershipIds, client });
    }
}

export default function TeamDetails({ actionData, loaderData }) {
    const { user, isAuthenticated } = useOutletContext();

    useResponseNotification(actionData);

    if (isAuthenticated === false) {
        return (
            <Container size="sm" py="xl" ta="center">
                <Title order={2} mb="md">
                    Private Team Page
                </Title>
                <Text size="lg" c="dimmed" mb="xl">
                    You must be logged in to view this team's details.
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

    const {
        teamData: team,
        players,
        managerIds,
        ownerIds,
        teamLogs,
        isArchiveView,
    } = loaderData;

    const userId = user && user.$id;
    const managerView = !isArchiveView && managerIds.indexOf(userId) !== -1;
    const ownerView = ownerIds && ownerIds.indexOf(userId) !== -1;

    const textProps = {
        size: "md",
    };

    const steps = getTeamDetailsSteps();

    return (
        <Container pt="md" size="xl">
            <Group justify="space-between" mb="xl">
                <BackButton to="/dashboard" />
                {managerView && (
                    <Box className="tour-team-menu">
                        <TeamMenu
                            team={team}
                            userId={user.$id}
                            ownerView={ownerView}
                            players={players}
                        />
                    </Box>
                )}
            </Group>
            {isArchiveView && (
                <Alert
                    color="blue"
                    variant="light"
                    mb="md"
                    title="Historical Archive View"
                >
                    You are viewing a read-only archive of this team's seasons
                    that you participated in.
                </Alert>
            )}
            <Title
                order={2}
                align="center"
                mt="sm"
                mb="lg"
                className="tour-team-title"
            >
                {team.name}
            </Title>
            <Text {...textProps} align="center">
                {team.leagueName}
            </Text>

            <Box visibleFrom="md">
                <DesktopTeamDetails
                    team={team}
                    players={players}
                    managerIds={managerIds}
                    managerView={managerView}
                    user={user}
                    teamLogs={teamLogs}
                />
            </Box>
            <Box hiddenFrom="md">
                <MobileTeamDetails
                    team={team}
                    players={players}
                    managerIds={managerIds}
                    managerView={managerView}
                    user={user}
                    teamLogs={teamLogs}
                />
            </Box>
            {managerView && (
                <OnboardingTour
                    tourKey="team_details"
                    steps={steps}
                    user={user}
                    menuId="team-details-menu"
                    trackingSuffix="teams"
                    alwaysIncludeTargets={[
                        ".tour-team-details-menu-section-team-options",
                        ".tour-team-details-menu-section-lineup-options",
                        ".tour-team-details-menu-section-roster",
                        ".tour-roster-section-desktop",
                    ]}
                />
            )}
        </Container>
    );
}
