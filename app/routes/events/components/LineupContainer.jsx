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

    return (
        <>
            {!localChart && (
                <>
                    {managerView ? (
                        <>
                            <Text align="center" c="dimmed" my="lg">Charts for this game have not yet been created. You can create them below.</Text>
                            <Button mt="sm" onClick={handleGenerateCharts} fullWidth>
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