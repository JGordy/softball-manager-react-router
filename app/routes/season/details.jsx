import { useState } from 'react';

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

import { getSeasonDetails } from './loader';

export async function loader({ params }) {
    const { seasonId } = params;

    return getSeasonDetails({ seasonId });
}

export default function SeasonDetails({ loaderData }) {
    const { season } = loaderData;
    console.log('/season/details.jsx: ', { season });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContents, setModalContents] = useState();
    const [error, setError] = useState();

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
            <Title order={4} mb="sm">Games</Title>
            <Text>There are {season.games.length} games listed for the upcoming season.</Text>
            {!hasGames && (
                <Button
                    mt="md"
                    onClick={handleGenerateGamesClick}
                    fullWidth
                    autoContrast
                >
                    Generate Games
                </Button>
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
                    <div>Update Season Details</div>
                )}
            </Modal>
        </Container>
    );
}