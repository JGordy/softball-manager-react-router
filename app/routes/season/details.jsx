import { useEffect } from 'react';

import {
    Button,
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
import GamesList from '@/components/GamesList';

import AddSingleGame from '@/forms/AddSingleGame';
import AddSeason from '@/forms/AddSeason';
import GenerateSeasonGames from '@/forms/GenerateSeasonGames';

import { createGames, createSingleGame } from '@/actions/games';
import { updateSeason } from '@/actions/seasons';

import { getSeasonById } from '@/loaders/seasons';
import { getParkById } from '@/loaders/parks';

export async function loader({ params }) {
    const { seasonId } = params;

    let park = null;
    const { season } = await getSeasonById({ seasonId });

    if (season.parkId) {
        park = await getParkById({ parkId: season.parkId });
    }

    return { season, park };
}

export async function action({ request, params }) {
    const { seasonId } = params;

    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

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

    console.log('/season/details.jsx: ', { loaderData });

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

    const record = hasGames && season.games.reduce((acc, game) => {
        if (game.result) {
            const { score, opponentScore } = game;
            const scoreFor = Number(score) || 0;
            const scoreAgainst = Number(opponentScore) || 0;

            acc.wins += scoreFor > scoreAgainst ? 1 : 0;
            acc.losses += scoreFor < scoreAgainst ? 1 : 0;
            acc.ties += scoreFor === scoreAgainst ? 1 : 0;
        }
        return acc;
    }, { wins: 0, losses: 0, ties: 0 });

    const textProps = {
        size: "md",
    };

    return (
        <>
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

            <Title order={4} mb="sm">
                <Group justify="space-between">
                    Games ({season.games.length})
                    <div>Record {record?.wins}-{record?.losses}-{record?.ties}</div>
                </Group>
            </Title>

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

            <GamesList games={season.games} />

            <Button
                mt="md"
                onClick={openAddGameModal}
                fullWidth
                autoContrast
            >
                <IconPlus size={18} />
                Create Single Game
            </Button>
        </>
    );
}