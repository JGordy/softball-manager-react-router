import { useState } from 'react';
import { useFetcher } from 'react-router';

import { Button, Group, Text } from '@mantine/core';

import PlayerChart from '@/components/PlayerChart';

import createBattingOrder from '../utils/createBattingOrder';
import createFieldingChart from '../utils/createFieldingChart';

export default function LineupContainer({
    availablePlayers,
    game,
    managerView,
    playerChart,
}) {

    const fetcher = useFetcher();

    const parsedChart = playerChart && JSON.parse(playerChart);

    const [localChart, setLocalChart] = useState(parsedChart);
    const [hasBeenEdited, setHasBeenEdited] = useState(false);
    // console.log('/event/:eventId > LineupContainer: ', { availablePlayers, playerChart, parsedChart, localChart });

    // NOTE: Most leagues require at least 8 players in the field to allow the teams to take the field
    // TODO: Add a database field for minimum number of players?
    const hasEnoughPlayers = (availablePlayers?.length > 7);

    let message = 'Charts for this game have not yet been created. You can create them below.';

    if (!hasEnoughPlayers) {
        message = `There are not have enough available players to generate a lineup. A minimum of 8 players is required (${availablePlayers.length} available).`;
    }

    const handleOnSave = () => {
        try {
            const formData = new FormData();
            formData.append('_action', 'save-chart');
            formData.append('playerChart', JSON.stringify(localChart));

            fetcher.submit(formData, { method: 'post', action: `/events/${game.$id}` });
        } catch (error) {
            console.error('Error submitting attendance form:', error);
        }
    };

    const handleResetChart = () => {
        setLocalChart(parsedChart);
        setHasBeenEdited(false);
    };

    // NOTE: Uses an algorithim I created to generate a lineup and fielding chart
    // TODO: We need to make a request to save this to the appwrite database
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

    const handleChartEdit = (position, playerName, inning) => {
        setLocalChart(prevChart => {
            return prevChart.map(player => {
                if (player.name === playerName) {
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
                        <Text align="center" c={!hasEnoughPlayers ? "red" : "dimmed"} my="lg">{message}</Text>
                        <Button mt="sm" onClick={handleCreateCharts} disabled={!hasEnoughPlayers} fullWidth>
                            Create Batting and Fielding Charts
                        </Button>
                    </>
                ) : (
                    <Text>Batting Lineup and Fielding Chart have not yet been created. Come back later.</Text>
                )}
            </>
        )
    }

    return (
        <>
            {localChart && (
                <>
                    <PlayerChart
                        players={players}
                        setPlayerChart={handleChartEdit}
                    />

                    {(managerView && hasBeenEdited) && (
                        <Group justify="space-between">
                            <Button
                                loading={fetcher.state === 'loading'}
                                onClick={handleOnSave}
                            >
                                Save Changes
                            </Button>

                            <Button
                                onClick={handleResetChart}
                                disabled={fetcher.state === 'loading'}
                            >
                                Reset Chart
                            </Button>
                        </Group>
                    )}
                </>
            )}
        </>
    );
}