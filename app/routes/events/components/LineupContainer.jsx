import { useState } from 'react';

import { Button, Text } from '@mantine/core';

export default function LineupContainer({
    availablePlayers,
    handleGenerateCharts,
    managerView,
    playerChart,
}) {

    const parsedChart = playerChart && JSON.parse(playerChart);

    const [localChart, setLocalChart] = useState(parsedChart);
    console.log('/event/:eventId > LineupContainer: ', { availablePlayers, playerChart, parsedChart, localChart });

    // NOTE: Most leagues require at least 8 players in the field to allow the teams to take the field
    const hasEnoughPlayers = (availablePlayers?.length > 7);

    let message = 'Charts for this game have not yet been created. You can create them below.';

    if (!hasEnoughPlayers) {
        message = 'You do not have enough players to generate a lineup. A minimum of 8 players is required.';
    }

    // hasEnoughPlayer
    return (
        <>
            {!localChart && (
                <>
                    {managerView ? (
                        <>
                            <Text align="center" c={!hasEnoughPlayers ? "red" : "dimmed"} my="lg">{message}</Text>
                            <Button mt="sm" onClick={handleGenerateCharts} disabled={!hasEnoughPlayers} fullWidth>
                                Generate Batting and Fielding Charts
                            </Button>
                        </>
                    ) : (
                        <Text>Batting Lineup and Fielding Chart have not yet been created. Come back later.</Text>
                    )}
                </>
            )}

            {localChart && (
                <Text>We have a chart!</Text>
            )}
        </>
    );
}