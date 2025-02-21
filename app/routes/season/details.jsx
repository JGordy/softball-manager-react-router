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

import BackButton from '@/components/BackButton';
import EditButton from '@/components/EditButton';

import GameGenerator from './components/GameGenerator';
import GamesTable from './components/GamesTable';
import SeasonDetailsForm from './components/SeasonDetailsForm';

import { getSeasonDetails } from './loader';
import { createGames, updateSeason } from './action';

export async function loader({ params }) {
    const { seasonId } = params;

    return getSeasonDetails({ seasonId });
}

export async function action({ request, params }) {
    const { seasonId } = params;

    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);
    console.log({ _action, values });

    if (_action === 'add-games') {
        return createGames({ values, seasonId })
    }

    if (_action === 'edit-season') {
        return updateSeason({ values, seasonId })
    }
};

export default function SeasonDetails({ loaderData, actionData }) {
    const { season } = loaderData;
    console.log('/season/details.jsx: ', { season });

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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalContents(null);
    }

    const hasGames = season?.games?.length > 0;

    const modalTitle = modalContents?.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <Container size="xl" p="xl">
            <Group justify="space-between">
                <BackButton text="Teams" />
                <EditButton setIsModalOpen={handleEditSeasonDetails} />
            </Group>
            <Title order={2} align="center" mt="sm" mb="lg">
                {season.seasonName}
            </Title>
            <Text>
                {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
            </Text>
            <Text>{`${season.gameDays}s`}</Text>
            <Text>{season.location}</Text>
            <Text>{season.leagueType}</Text>
            <Text>{`$${season.signUpFee}/player`}</Text>

            <Divider size="sm" my="sm" />

            <Title order={4} mb="sm">Games ({season.games.length})</Title>

            {!hasGames && (
                <>
                    <Text>There are no games listed for the upcoming season.</Text>
                    <Button
                        mt="md"
                        onClick={handleGenerateGamesClick}
                        fullWidth
                        autoContrast
                    >
                        Generate Games
                    </Button>
                </>
            )}

            {hasGames && (
                <GamesTable games={season.games} />
            )}

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
            </Modal>
        </Container>
    );
}