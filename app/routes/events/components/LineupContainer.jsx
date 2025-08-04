import { useState } from 'react';
import { useFetcher } from 'react-router';

import { Alert, Button, Group, Text } from '@mantine/core';
import { useListState } from '@mantine/hooks';

import { DragDropContext } from '@hello-pangea/dnd';

import {
    IconArrowBackUp,
    IconInfoCircle,
    IconPlus,
    // IconTrashX,
} from '@tabler/icons-react';

import PlayerChart from '@/components/PlayerChart';

import createBattingOrder from '../utils/createBattingOrder';
import createFieldingChart from '../utils/createFieldingChart';

export default function LineupContainer({
    game,
    managerView,
    playerChart,
    players,
}) {

    const fetcher = useFetcher();

    const [localChart, setLocalChart] = useState(playerChart);
    const [hasBeenEdited, setHasBeenEdited] = useState(false);

    const [listState, handlers] = useListState(localChart);

    const availablePlayers = players?.filter(p => p.available === 'accepted');
    // console.log('/event/:eventId > LineupContainer: ', { availablePlayers, playerChart, parsedChart, localChart, players });

    // NOTE: Most leagues require at least 8 players in the field to allow the teams to take the field
    // TODO: Add a database field for minimum number of players?
    const hasEnoughPlayers = (availablePlayers?.length > 7);

    let message = 'Charts for this game have not yet been created. You can create them below.';

    if (!hasEnoughPlayers) {
        message = `There aren't enough available players to create a lineup. A minimum of 8 players is required (${availablePlayers.length} available).`;
    }

    const handleOnSave = () => {
        try {
            const formData = new FormData();
            formData.append('_action', 'save-chart');
            formData.append('playerChart', JSON.stringify(listState));

            fetcher.submit(formData, { method: 'post', action: `/events/${game.$id}/lineup` });
        } catch (error) {
            console.error('Error submitting attendance form:', error);
        }
    };

    const handleResetChart = () => {
        setLocalChart(playerChart);
        setHasBeenEdited(false);
    };

    // const handleDeleteChart = () => {
    //     setLocalChart(null);
    //     setHasBeenEdited(false);

    //     try {
    //         const formData = new FormData();
    //         formData.append('_action', 'save-chart');
    //         formData.append('playerChart', null);

    //         fetcher.submit(formData, { method: 'post', action: `/events/${game.$id}/lineup` });
    //     } catch (error) {
    //         console.error('Error deleting attendance form:', error);
    //     }
    // };

    // NOTE: Uses an algorithim I created to generate a lineup and fielding chart
    const handleCreateCharts = () => {
        if (hasEnoughPlayers) {
            setLocalChart();

            const batting = createBattingOrder(availablePlayers);

            if (batting?.length > 0) {
                const fieldingChart = createFieldingChart(batting);

                if (fieldingChart?.length > 0) {
                    setLocalChart(fieldingChart);
                }

                handleOnSave();
            }
        }
    };

    // NOTE: For generative AI to output in a json format
    // const handleGenerateCharts = () => {
    // NOTE: Example data
    // try {
    //     const formData = new FormData();
    //     formData.append('_action', 'create-attendance');
    //     formData.append('team', JSON.stringify(team));
    //     formData.append('gameDate', gameDate);
    //     formData.append('opponent', opponent);
    //     formData.append('gameId', gameId);

    //     fetcher.submit(formData, { method: 'post', action: `/events/${gameId}` }); // Use fetcher.submit
    // } catch (error) {
    //     console.error('Error submitting attendance form:', error);
    // }
    // };

    const handleEditChart = (position, playerId, inning) => {
        setLocalChart(prevChart => {
            return prevChart.map(player => {
                if (player.$id === playerId) {
                    const inningIndex = parseInt(inning.replace('inning', ''), 10) - 1;
                    const updatedPositions = [...player.positions];
                    updatedPositions[inningIndex] = position;
                    return { ...player, positions: updatedPositions };
                }
                return player;
            });
        });

        setHasBeenEdited(true);
    };

    if (!localChart) {
        return (
            <>
                {managerView ? (
                    <>
                        <Alert
                            title={hasEnoughPlayers ? 'Charts not yet created' : 'Not enough players'}
                            variant="light"
                            color={hasEnoughPlayers ? 'yellow' : 'red'}
                            icon={<IconInfoCircle size={18} />}
                        >
                            {message}
                        </Alert>
                        {hasEnoughPlayers && (
                            <Button mt="sm" onClick={handleCreateCharts} fullWidth>
                                Create Batting and Fielding Charts
                            </Button>
                        )}
                    </>
                ) : (
                    <Text>Batting Lineup and Fielding Chart have not yet been created. Come back later.</Text>
                )}
            </>
        )
    }

    const handleLineupReorder = ({ destination, source }) => {
        if (destination.index !== source.index) {
            setHasBeenEdited(true);
        }
        return handlers.reorder({ from: source.index, to: destination?.index || 0 });
    }

    const buttonProps = {
        disabled: fetcher.state === 'loading',
        loading: fetcher.state === 'loading',
        loaderProps: { type: 'dots' },
    }

    return (
        <>
            {localChart && (
                <>
                    <DragDropContext onDragEnd={handleLineupReorder}>
                        <PlayerChart
                            setPlayerChart={handleEditChart}
                            playerChart={listState}
                            managerView={managerView}
                        />
                    </DragDropContext>

                    {(managerView && hasBeenEdited) && (
                        <Group justify="space-between" my="lg" grow>
                            <Button
                                {...buttonProps}
                                color="blue"
                                leftSection={<IconArrowBackUp size={18} />}
                                onClick={handleResetChart}
                                variant="light"
                            >
                                Reset
                            </Button>
                            {/* <Button
                                {...buttonProps}
                                color="red"
                                leftSection={<IconTrashX size={18} />}
                                onClick={handleDeleteChart}
                                variant="light"
                            >
                                Delete
                            </Button> */}
                            <Button
                                {...buttonProps}
                                leftSection={<IconPlus size={18} />}
                                onClick={handleOnSave}
                            >
                                Save Changes
                            </Button>
                        </Group>
                    )}
                </>
            )}
        </>
    );
}