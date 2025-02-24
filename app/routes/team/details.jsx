
import { useState, useEffect } from 'react';

import {
    Alert,
    Container,
    Group,
    Modal,
    Tabs,
    Text,
    Title,
} from '@mantine/core';

import {
    IconCalendarMonth,
    IconUsersGroup,
    IconBallBaseball,
} from '@tabler/icons-react';

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
    // console.log({ _action, values });

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
    const { teamData: team, players, managerId } = loaderData;

    const { user } = useAuth();

    const managerView = managerId === user?.$id;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.success) {
                    setError(null);
                    setIsModalOpen(false);
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

    const { primaryColor, seasons } = team;

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
                <BackButton text="Teams" to="/teams" />
                <EditButton setIsModalOpen={handleEditTeamDetailsModal} />
            </Group>
            <Title order={2} align="center" mt="sm" mb="lg">
                {team.name}
            </Title>
            <Text {...textProps} align="center">
                {team.leagueName}
            </Text>

            <Tabs color={primaryColor} radius="md" defaultValue="roster" mt="xl">
                <Tabs.List grow justify="center">
                    <Tabs.Tab value="roster" size="lg" leftSection={<IconUsersGroup size={16} />}>
                        Roster
                    </Tabs.Tab>
                    <Tabs.Tab value="seasons" size="lg" leftSection={<IconCalendarMonth size={16} />}>
                        Seasons
                    </Tabs.Tab>
                    <Tabs.Tab value="games" size="lg" leftSection={<IconBallBaseball size={16} />} disabled>
                        Games
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="roster">
                    <PlayerList
                        players={players}
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
                    <GamesList games={[]} primaryColor={primaryColor} />
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
                        teamId={team.$id}
                    />
                )}
                {modalContent === 'details' && (
                    <TeamDetailsForm
                        handleCloseModal={handleCloseModal}
                        setError={setError}
                        primaryColor={primaryColor}
                        teamId={team.$id}
                    />
                )}
            </Modal>
        </Container >
    );
};