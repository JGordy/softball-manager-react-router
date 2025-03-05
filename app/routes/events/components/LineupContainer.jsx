import { useState } from 'react';
import { Title, Button, Text } from '@mantine/core';

export default function LineupContainer({ availablePlayers, playerChart }) {
    const parsedChart = playerChart && JSON.parse(playerChart);

    const [localChart, setLocalChart] = useState(parsedChart);
    console.log('/event/:eventId > LineupContainer: ', { availablePlayers, playerChart, parsedChart, localChart });

    return (
        <>
            {/* TODO: For this section we need to know all players that have checked in for this game */}
            {/* TODO: We would need the polling in place for this to work */}
            <Title order={4} align="center">Lineup and field chart</Title>

            {!localChart && (
                <>
                    <Text align="center" c="dimmed" my="lg">Charts for this game have not yet been created. Start creating them below.</Text>
                    <Button mt="sm" onClick={() => { }} fullWidth>
                        Generate lineup and fielding chart
                    </Button>
                </>
            )}

            {localChart && (
                <Text>We have a chart!</Text>
            )}
        </>
    );
}