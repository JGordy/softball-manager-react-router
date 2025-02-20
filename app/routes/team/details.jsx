
import { useState, useEffect } from 'react';

import {
    Alert,
    Container,
    Divider,
    Group,
    Modal,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';

import {
    IconFriends,
    IconCalendarMonth,
    IconUsersGroup,
    IconBallBaseball,
} from '@tabler/icons-react';

import { adjustColorBasedOnDarkness } from '@/utils/adjustHexColor';

import BackButton from '@/components/BackButton';
import EditButton from '@/components/EditButton';

import { useAuth } from '@/contexts/auth/useAuth';

import PlayerForm from './components/PlayerForm';
import PlayerList from './components/PlayerList';
import SeasonForm from './components/SeasonForm';
import SeasonList from './components/SeasonList';
import GamesList from './components/GamesList';
import TeamDetailsForm from './components/TeamDetailsForm';

import { getTeamData } from './loader';
import { createPlayer, createSeason, updateTeam } from './action';

export async function loader({ params }) {
    const { teamId } = params;
    return getTeamData({ teamId });
};

export async function action({ request, params }) {
    const { teamId } = params;
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    console.log({ _action, values });

    if (_action === 'add-player') {
        return createPlayer({ values, teamId });
    }

    if (_action === 'add-season') {
        return createSeason({ values, teamId })
    }

    if (_action === 'edit-team') {
        return updateTeam({ values, teamId })
    }
};

export default function TeamDetails({ actionData, loaderData }) {
    const { teamData, players, managerId } = loaderData;

    const { user } = useAuth();

    const managerView = managerId === user?.$id;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const [teamDetails, setTeamDetails] = useState(teamData || {});
    const [playerList, setPlayerList] = useState(players || []);
    const [error, setError] = useState(null);

    // console.log("team/details.jsx:", { teamDetails, seasons: teamDetails.seasons, playerList, managerId });

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.success) {
                    console.log('team details > after submit: ', actionData);
                    setError(null);
                    setIsModalOpen(false);

                    // TODO: Determine if this is needed?
                    if (actionData.response.season) {
                        setTeamDetails(details => ({
                            ...details,
                            seasons: [...details.seasons, actionData.response.season],
                        }));
                    }

                    // TODO: Determine if this is needed?
                    if (actionData.response.season) {
                        setPlayerList(list => ([
                            ...list,
                            ...actionData.response.player,
                        ]));
                    }

                    if (actionData.response.teamDetails) {
                        setTeamDetails(details => ({
                            ...details,
                            ...actionData.response.teamDetails,
                        }))
                    }
                } else if (actionData instanceof Error) {
                    setError(actionData.message);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                setError("An error occurred during player creation.");
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const { primaryColor, seasons } = teamDetails;
    const adjustedColor = adjustColorBasedOnDarkness(primaryColor, 50);

    const iconProps = {
        variant: 'gradient',
        gradient: { from: primaryColor, to: adjustedColor, deg: 270 },
        size: 'lg',
        // autoContrast: true, // Only works when not using gradients?
    };

    const textProps = {
        size: "md",
        // c: "dimmed",
    }

    const handlePlayerListModal = () => {
        setModalContent('playerList');
        setIsModalOpen(true);
    };

    const handleSeasonListModal = () => {
        setModalContent('seasonList');
        setIsModalOpen(true);
    };

    const handleEditTeamDetailsModal = () => {
        setModalContent('details');
        setIsModalOpen(true);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    }

    return (
        <Container size="xl" p="xl">
            <Group justify="space-between">
                <BackButton text="Teams" />
                <EditButton setIsModalOpen={handleEditTeamDetailsModal} />
            </Group>
            <Title order={2} align="center" mt="sm" mb="lg">
                {teamDetails.name}
            </Title>
            <Text {...textProps} align="center">
                {teamDetails.leagueName}
            </Text>
            <Divider my="sm" />

            <Stack spacing="sm">
                <Group spacing="xs">
                    <ThemeIcon {...iconProps}>
                        <IconFriends size={18} />
                    </ThemeIcon>
                    <Text {...textProps}>
                        {teamDetails.genderMix}
                    </Text>
                </Group>
            </Stack>

            <Tabs color={primaryColor} radius="md" defaultValue="roster" mt="lg">
                <Tabs.List grow justify="center">
                    <Tabs.Tab value="roster" size="lg" leftSection={<IconUsersGroup size={16} />}>
                        Roster
                    </Tabs.Tab>
                    <Tabs.Tab value="seasons" size="lg" leftSection={<IconCalendarMonth size={16} />}>
                        Seasons
                    </Tabs.Tab>
                    <Tabs.Tab value="games" size="lg" leftSection={<IconBallBaseball size={16} />}>
                        Games
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="roster">
                    <PlayerList
                        players={playerList}
                        managerId={managerId}
                        managerView={managerView}
                        handlePlayerListModal={handlePlayerListModal}
                        primaryColor={primaryColor}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="seasons">
                    <SeasonList
                        seasons={seasons}
                        managerView={managerView}
                        primaryColor={primaryColor}
                        handleSeasonListModal={handleSeasonListModal}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="games">
                    <GamesList games={[]} primaryColor={teamDetails.primaryColor} />
                </Tabs.Panel>
            </Tabs>

            <Modal opened={isModalOpen} onClose={handleCloseModal} title={modalContent === 'playerList' ? 'Add Player' : 'Add Season'}>
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                {modalContent === 'playerList' && (
                    <PlayerForm
                        handleCloseModal={handleCloseModal}
                        setError={setError}
                        primaryColor={primaryColor}
                    />
                )}
                {modalContent === 'seasonList' && (
                    <SeasonForm
                        handleCloseModal={handleCloseModal}
                        setError={setError}
                        primaryColor={primaryColor}
                        teamId={teamDetails.$id}
                    />
                )}
                {modalContent === 'details' && (
                    <TeamDetailsForm
                        handleCloseModal={handleCloseModal}
                        setError={setError}
                        primaryColor={primaryColor}
                        teamId={teamDetails.$id}
                    />
                )}
            </Modal>
        </Container >
    );
};