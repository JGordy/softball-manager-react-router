import { useState, useEffect } from 'react';

import {
    Button,
    Container,
    Divider,
    Group,
    Modal,
    Text,
    Title,
} from '@mantine/core';

import {
    IconCalendar,
    IconCalendarRepeat,
    IconCurrencyDollar,
    IconFriends,
    IconMapPin,
    IconPlus,
} from '@tabler/icons-react';

import BackButton from '@/components/BackButton';
import EditButton from '@/components/EditButton';

import GameGenerator from './components/GameGenerator';
import GamesTable from './components/GamesTable';
import SeasonDetailsForm from './components/SeasonDetailsForm';
import SingleGameForm from './components/SingleGameForm';

import { getSeasonDetails } from './loader';
import { createGames, createSingleGame, updateSeason } from './action';

export async function loader({ params }) {
    const { seasonId } = params;

    return getSeasonDetails({ seasonId });
}

export async function action({ request, params }) {
    const { seasonId } = params;

    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    // console.log({ _action, values });

    if (_action === 'edit-season') {
        return updateSeason({ values, seasonId })
    }

    if (_action === 'add-games') {
        return createGames({ values, seasonId })
    }

    if (_action === 'add-single-game') {
        return createSingleGame({ values });
    }
};

export default function SeasonDetails({ loaderData, actionData }) {
    const { season } = loaderData;
    // console.log('/season/details.jsx: ', { season });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContents, setModalContents] = useState();
    const [error, setError] = useState();

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

    const handleEditSeasonDetails = () => {
        setModalContents('edit-season');
        setIsModalOpen(true);
    };

    const handleGenerateGamesClick = () => {
        setModalContents('generate-games');
        setIsModalOpen(true);
    };

    const handleCreateGameClick = () => {
        setModalContents('add-single-game');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalContents(null);
    }

    const hasGames = season?.games?.length > 0;

    const modalTitle = modalContents?.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const textProps = {
        size: "md",
        // c: "dimmed",
    };

    console.log({ season });

    return (
        <Container size="xl" p="xl">
            <Group justify="space-between">
                <BackButton text="Teams" to={`/team/${season.teamId}`} />
                <EditButton setIsModalOpen={handleEditSeasonDetails} />
            </Group>
            <Title order={2} align="center" mt="sm">
                {season.seasonName}
            </Title>

            <Divider my="md" size="sm" />

            <Text>
                {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
            </Text>

            <Group mt="sm" justify="space-between">
                <Group gap="5px">
                    <IconMapPin size={18} />
                    <Text {...textProps}>
                        {season.location || "Not specified"}
                    </Text>
                </Group>

                <Group gap="5px">
                    <IconCalendarRepeat size={18} />
                    <Text {...textProps}>
                        {`${season.gameDays}s`}
                    </Text>
                </Group>

                <Group gap="5px">
                    <IconFriends size={18} />
                    <Text {...textProps}>
                        {season.leagueType}
                    </Text>
                </Group>

                <Group gap="5px">
                    <IconCurrencyDollar size={18} />
                    <Text {...textProps}>
                        {`${season.signUpFee || 'TBD'}/player`}
                    </Text>
                </Group>
            </Group>

            <Divider size="sm" my="md" />

            <Title order={4} mb="sm">Games ({season.games.length})</Title>

            {!hasGames && (
                <>
                    <Text>There are no games listed for the upcoming season.</Text>
                    <Button
                        my="md"
                        onClick={handleGenerateGamesClick}
                        fullWidth
                        autoContrast
                    >
                        <IconCalendar size={18} />
                        Generate games
                    </Button>

                    <Text align="center">- OR -</Text>
                </>
            )}

            {hasGames && (
                <GamesTable
                    columns={['opponent', 'score', 'opponentScore', 'result']}
                    games={season.games}
                    variant="vertical"
                    striped
                />
            )}

            <Button
                mt="md"
                onClick={handleCreateGameClick}
                fullWidth
                autoContrast
            >
                <IconPlus size={18} />
                Create Single Game
            </Button>

            <Modal opened={isModalOpen} onClose={handleCloseModal} title={modalTitle}>
                {error && <Alert type="error" mb="md" c="red">{error}</Alert>}
                {modalContents === 'generate-games' && (
                    <GameGenerator
                        season={season}
                        handleCloseModal={handleCloseModal}
                        setError={setError}
                    />
                )}
                {modalContents === 'edit-season' && (
                    <SeasonDetailsForm
                        season={season}
                        handleCloseModal={handleCloseModal}
                        setError={setError}
                    />
                )}
                {modalContents === 'add-single-game' && (
                    <SingleGameForm
                        season={season}
                        handleCloseModal={handleCloseModal}
                        setError={setError}
                    />
                )}
            </Modal>
        </Container>
    );
}