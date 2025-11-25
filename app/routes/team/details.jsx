import { useOutletContext } from "react-router";

import { Container, Group, Tabs, Text, Title } from "@mantine/core";

import {
    IconCalendarMonth,
    IconUsersGroup,
    IconBallBaseball,
} from "@tabler/icons-react";

import images from "@/constants/images";

import BackButton from "@/components/BackButton";
import TabsWrapper from "@/components/TabsWrapper";

import { createSingleGame } from "@/actions/games";
import { createPlayer } from "@/actions/users";
import { createSeason } from "@/actions/seasons";
import { updateTeam } from "@/actions/teams";
import { inviteUserByEmail } from "@/utils/invitations";

import { getTeamById } from "@/loaders/teams";

import { useResponseNotification } from "@/utils/showNotification";

import PlayerList from "./components/PlayerList";
import SeasonList from "./components/SeasonList";
import GamesList from "./components/GamesList";
import TeamMenu from "./components/TeamMenu";

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

    if (_action === "invite-player") {
        const { email, name } = values;
        const origin = new URL(request.url).origin;
        const verificationUrl = `${origin}/verify`;

        return inviteUserByEmail({
            email,
            teamId,
            name,
            verificationUrl,
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
}

export default function TeamDetails({ actionData, loaderData }) {
    const { teamData: team, players, managerIds } = loaderData;
    // console.log('/team/details >', { players, team, managerIds });

    const { user } = useOutletContext();

    const managerView = managerIds.includes(user?.$id);

    useResponseNotification(actionData);

    const { primaryColor, seasons } = team;

    const textProps = {
        size: "md",
    };

    return (
        <Container pt="md">
            <Group justify="space-between" mb="xl">
                <BackButton to="/" />
                {managerView && <TeamMenu team={team} userId={user.$id} />}
            </Group>
            <Title order={2} align="center" mt="sm" mb="lg">
                {team.name}
            </Title>
            <Text {...textProps} align="center">
                {team.leagueName}
            </Text>

            <TabsWrapper color={primaryColor} defaultValue="seasons">
                <Tabs.Tab value="roster">
                    <Group gap="xs" align="center" justify="center">
                        <IconUsersGroup size={16} />
                        Roster
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="seasons">
                    <Group gap="xs" align="center" justify="center">
                        <IconCalendarMonth size={16} />
                        Seasons
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="games" disabled={seasons?.length === 0}>
                    <Group gap="xs" align="center" justify="center">
                        <IconBallBaseball size={16} />
                        Games
                    </Group>
                </Tabs.Tab>

                <Tabs.Panel value="roster">
                    <PlayerList
                        players={players}
                        managerIds={managerIds}
                        managerView={managerView}
                        user={user}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="seasons">
                    <SeasonList
                        seasons={seasons}
                        teamId={team.$id}
                        managerView={managerView}
                        primaryColor={primaryColor}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="games">
                    <GamesList
                        games={seasons?.[0]?.games}
                        seasons={seasons}
                        teamId={team.$id}
                        managerView={managerView}
                        primaryColor={primaryColor}
                    />
                </Tabs.Panel>
            </TabsWrapper>
        </Container>
    );
}
