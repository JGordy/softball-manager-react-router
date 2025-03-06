import { useState } from 'react';
// import { useFetcher } from 'react-router';

import { Button, Text } from '@mantine/core';

export default function LineupContainer({
    availablePlayers,
    managerView,
    playerChart,
}) {

    // const fetcher = useFetcher();

    const parsedChart = playerChart && JSON.parse(playerChart);

    const [localChart, setLocalChart] = useState(parsedChart);
    console.log('/event/:eventId > LineupContainer: ', { availablePlayers, playerChart, parsedChart, localChart });

    // NOTE: Most leagues require at least 8 players in the field to allow the teams to take the field
    // TODO: Add a database field for minimum number of players?
    const hasEnoughPlayers = (availablePlayers?.length > 7);

    let message = 'Charts for this game have not yet been created. You can create them below.';

    if (!hasEnoughPlayers) {
        message = 'You do not have enough players to generate a lineup. A minimum of 8 players is required.';
    }

    // NOTE: Uses an algorithim I created to generate a lineup and fielding chart
    const handleCreateCharts = () => {
        setLocalChart();

        const batting = createBattingOrder(availablePlayers);

        if (batting?.length > 0) {
            const fieldingChart = createFieldingChart(batting);

            if (fieldingChart?.length > 0) {
                setLocalChart(fieldingChart);
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
                <Text>We have a chart!</Text>
            )}
        </>
    );
}