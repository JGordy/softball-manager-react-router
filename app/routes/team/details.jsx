import { useOutletContext } from "react-router";

import { Box, Container, Group, Text, Title } from "@mantine/core";

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
} from "@/actions/teams";
import {
    invitePlayersServer,
    syncInvitedPlayersServer,
} from "@/actions/invitations";

import { getTeamById } from "@/loaders/teams";

import { useResponseNotification } from "@/utils/showNotification";

import { createSessionClient } from "@/utils/appwrite/server";

import TeamMenu from "./components/TeamMenu";
import MobileTeamDetails from "./components/MobileTeamDetails";
import DesktopTeamDetails from "./components/DesktopTeamDetails";
import OnboardingTour from "@/components/OnboardingTour";

export function links() {
    const { fieldSrc } = images;
    return [{ rel: "preload", href: fieldSrc, as: "image" }];
}

export async function loader({ params, request }) {
    const { teamId } = params;
    const client = await createSessionClient(request);
    return getTeamById({ teamId, client });
}

export async function action({ request, params }) {
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

    const client = await createSessionClient(request);

    if (_action === "add-player") {
        return createPlayer({ values, teamId, client });
    }

    if (_action === "update-preferences") {
        return updatePreferences({
            teamId,
            prefs: { maxMaleBatters: values.maxMaleBatters },
        });
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
}

export default function TeamDetails({ actionData, loaderData }) {
    const {
        teamData: team,
        players,
        managerIds,
        ownerIds,
        teamLogs,
    } = loaderData;
    // console.log('/team/details >', { players, team, managerIds });

    const { user, isDesktop } = useOutletContext();

    const userId = user && user.$id;
    const managerView = managerIds.indexOf(userId) !== -1;
    const ownerView = ownerIds && ownerIds.indexOf(userId) !== -1;

    useResponseNotification(actionData);

    const textProps = {
        size: "md",
    };

    const steps = [
        {
            target: ".tour-team-title",
            content:
                "Welcome to your Team Details page! Here you can manage and view your team's roster, seasons overview, recent results, and upcoming games.",
            skipBeacon: true,
            locale: {
                next: "Start Tour",
                skip: "Skip",
            },
        },
        {
            target: ".tour-team-menu",
            content:
                "As a team manager, you have access to the Team Options menu. Let's look inside at the actions you can take.",
        },
        {
            target: ".tour-menu-section-team-options",
            content:
                "Under Team Options, you can edit the team's league name or visual branding, register new seasons, and schedule upcoming games.",
            placement: "left",
        },
        {
            target: ".tour-menu-section-roster",
            content:
                "The Roster section is vital for organization: 'Set Lineups' directs you to set the ideal batting order and defensive positioning; 'Invite Players' sends email onboarding invites; 'Assign Numbers' lets you bulk-manage jersey numbers.",
            placement: "left",
        },
        ...(isDesktop
            ? [
                  {
                      target: ".tour-roster-section",
                      content:
                          "This is your team roster. You can view all players, their primary/secondary positions, jersey numbers, and stats.",
                  },
                  {
                      target: ".tour-seasons-overview",
                      content:
                          "This is the Seasons Overview. From here, you can track active and past seasons, overview played games, and drill into specific season stats.",
                  },
              ]
            : []),
        ...(!isDesktop
            ? [
                  {
                      target: ".tour-mobile-tabs",
                      content:
                          "Use these mobile tabs to quickly switch between the team roster, active seasons, and scheduled games.",
                  },
              ]
            : []),
    ];

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
                />
            )}
        </Container>
    );
}
