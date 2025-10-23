import { useEffect } from "react";

import { Container, Group, Tabs, Text, Title } from "@mantine/core";

import {
    IconCalendarMonth,
    IconUsersGroup,
    IconBallBaseball,
} from "@tabler/icons-react";

import images from "@/constants/images";

import BackButton from "@/components/BackButton";
import EditButton from "@/components/EditButton";

import AddTeam from "@/forms/AddTeam";
import { createSingleGame } from "@/actions/games";
import { createPlayer } from "@/actions/users";
import { createSeason } from "@/actions/seasons";
import { updateTeam } from "@/actions/teams";

import { getTeamById } from "@/loaders/teams";

import { useAuth } from "@/contexts/auth/useAuth";

import useModal from "@/hooks/useModal";

import PlayerList from "./components/PlayerList";
import SeasonList from "./components/SeasonList";
import GamesList from "./components/GamesList";

export function links() {
    const { fieldSrc } = images;
    return [{ rel: "preload", href: fieldSrc, as: "image" }];
}

export async function loader({ params }) {
    const { teamId } = params;
    return getTeamById({ teamId });
}

export async function action({ request, params }) {
    const { teamId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action === "add-player") {
        return createPlayer({ values, teamId });
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

    const { openModal, closeAllModals } = useModal();

    const { session } = useAuth();

    const managerView = managerIds.includes(session?.userId);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.success) {
                    closeAllModals();
                } else if (actionData instanceof Error) {
                    console.error("Error parsing action data:", actionData);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON data:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const { primaryColor, seasons } = team;

    const textProps = {
        size: "md",
    };

    const openTeamDetailsForm = () =>
        openModal({
            title: "Update Team Details",
            children: (
                <AddTeam
                    action="edit-team"
                    actionRoute={`/team/${team.$id}`}
                    buttonColor={primaryColor}
                />
            ),
        });

    return (
        <Container pt="md">
            <Group justify="space-between" mb="xl">
                <BackButton text="Teams" to="/teams" />
                <EditButton setIsModalOpen={openTeamDetailsForm} />
            </Group>
            <Title order={2} align="center" mt="sm" mb="lg">
                {team.name}
            </Title>
            <Text {...textProps} align="center">
                {team.leagueName}
            </Text>

            <Tabs
                color={primaryColor}
                radius="md"
                defaultValue="seasons"
                mt="xl"
            >
                <Tabs.List grow justify="center">
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
                    <Tabs.Tab value="games" disabled={seasons.length === 0}>
                        <Group gap="xs" align="center" justify="center">
                            <IconBallBaseball size={16} />
                            Games
                        </Group>
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="roster">
                    <PlayerList
                        players={players}
                        managerIds={managerIds}
                        managerView={managerView}
                        primaryColor={primaryColor}
                        teamId={team.$id}
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
            </Tabs>
        </Container>
    );
}
