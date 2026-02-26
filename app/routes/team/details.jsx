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
} from "@/actions/teams";
import { invitePlayersServer } from "@/actions/invitations";

import { getTeamById } from "@/loaders/teams";

import { useResponseNotification } from "@/utils/showNotification";

import TeamMenu from "./components/TeamMenu";
import MobileTeamDetails from "./components/MobileTeamDetails";
import DesktopTeamDetails from "./components/DesktopTeamDetails";

export function links() {
    const { fieldSrc } = images;
    return [{ rel: "preload", href: fieldSrc, as: "image" }];
}

export async function loader({ params, request }) {
    const { teamId } = params;
    return getTeamById({ teamId, request });
}

export async function action({ request, params }) {
    const { teamId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "add-player") {
        return createPlayer({ values, teamId });
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

        // Build the invitation URL from the request
        const url = new URL(request.url);
        const inviteUrl = `${url.origin}/team/${teamId}/accept-invite`;

        return invitePlayersServer({
            players,
            teamId,
            url: inviteUrl,
            request,
        });
    }

    if (_action === "add-season") {
        return createSeason({ values, teamId });
    }

    if (_action === "edit-team") {
        return updateTeam({ values, teamId });
    }

    if (_action === "add-single-game") {
        return createSingleGame({ values, teamId });
    }

    if (_action === "update-role") {
        return updateMemberRole({ values, teamId, request });
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

    const { user } = useOutletContext();

    const managerView = managerIds.includes(user?.$id);
    const ownerView = ownerIds?.includes(user?.$id);

    useResponseNotification(actionData);

    const textProps = {
        size: "md",
    };

    return (
        <Container pt="md" size="xl">
            <Group justify="space-between" mb="xl">
                <BackButton to="/dashboard" />
                {managerView && (
                    <TeamMenu
                        team={team}
                        userId={user.$id}
                        ownerView={ownerView}
                        players={players}
                    />
                )}
            </Group>
            <Title order={2} align="center" mt="sm" mb="lg">
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
                    ownerView={ownerView}
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
        </Container>
    );
}
