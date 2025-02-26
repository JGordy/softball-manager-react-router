import { useEffect } from 'react';

import {
    Button,
    Container,
    Divider,
    Group,
    Text,
    Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';

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
import GamesTable from '@/components/GamesTable';

import AddSingleGame from '@/forms/AddSingleGame';
import AddSeason from '@/forms/AddSeason';
import GenerateSeasonGames from '@/forms/GenerateSeasonGames';

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

    useEffect(() => {
        const handleAfterSubmit = async () => {
            try {
                if (actionData?.success) {
                    modals.closeAll();
                } else if (actionData instanceof Error) {
                    console.error("Error in actions:", actionData.message);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
            }
        };

        handleAfterSubmit();
    }, [actionData]);

    const openGenerateGamesModal = () => modals.open({
        title: 'Generate Game Placeholders',
        children: (
            <GenerateSeasonGames
                actionRoute={`/season/${season.$id}`}
                season={season}
            />
        ),
    });

    const openAddGameModal = () => modals.open({
        title: 'Add a Single Game',
        children: (
            <AddSingleGame
                action="add-single-game"
                actionRoute={`/season/${season.$id}`}
                seasonId={season.$id}
            />
        ),
    });

    const openEditSeasonModal = () => modals.open({
        title: 'Update Season Details',
        children: (
            <AddSeason
                action="edit-season"
                actionRoute={`/season/${season.$id}`}
                confirmText="Update Season"
                teamId={season.teamId}
            />
        ),
    });

    const hasGames = season?.games?.length > 0;

    const textProps = {
        size: "md",
    };

    return (
        <Container size="xl" p="xl">
            <Group justify="space-between">
                <BackButton text="Teams" to={`/team/${season.teamId}`} />
                <EditButton setIsModalOpen={openEditSeasonModal} />
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
                        onClick={openGenerateGamesModal}
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
                onClick={openAddGameModal}
                fullWidth
                autoContrast
            >
                <IconPlus size={18} />
                Create Single Game
            </Button>
        </Container>
    );
}