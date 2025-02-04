import { useState, useEffect } from 'react';
import {
    Button,
    Group,
    Center,
    Container,
} from '@mantine/core';

import PlayerChart from '@components/PlayerChart';

import { IconWand, IconPrinter } from '@tabler/icons-react';

import createBattingOrder from './utils/createBattingOrder';
import createFieldingChart from './utils/createFieldingChart';

function Lineup() {
    const [players, setPlayers] = useState();
    const [playerChart, setPlayerChart] = useState();
    const [error, setError] = useState();
    const [isLoading, setIsLoading] = useState();

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await fetch('/players.json', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                const data = await response.json();
                setPlayers(data.players);
            } catch (error) {
                console.error('Error:', error);
                setError('An error occurred. Please try again later.');
            }
        };

        if (!players) {
            fetchPlayers();
        };
    }, []);


    const handleCreateLineup = () => {
        setPlayerChart();
        setIsLoading(true);
        // Create batting order and fielding chart
        const batting = createBattingOrder(players);

        if (batting?.length > 0) {
            const fieldingChart = createFieldingChart(batting);

            if (fieldingChart?.length > 0) {
                setPlayerChart(fieldingChart);
            }
        }
        setIsLoading(false);
    };

    const handleGenerateLineup = async () => {
        try {
            const response = await fetch('/api/generate/lineup');
            const data = await response.json();
            // Handle the response data here
        } catch (error) {
            console.error('Error generating lineup:', error);
        }
    };

    const handlePrint = () => {
        window.print(); // Triggers the browser's print dialog
    };

    return (
        <Container>
            <Center>
                <Group position="center" spacing="md" mt="xl">
                    <Button
                        variant="filled"
                        color="blue"
                        onClick={handleCreateLineup}
                    >
                        Create Lineup
                    </Button>
                    <Button
                        variant="filled"
                        color="green"
                        onClick={handleGenerateLineup}
                    >
                        <IconWand size={18} />
                        Generate Lineup
                    </Button>
                </Group>
            </Center>
            <PlayerChart playerChart={playerChart} />
            {playerChart && (
                <Button onClick={handlePrint}>
                    <IconPrinter size={18} />
                    Print/Download
                </Button>
            )}
        </Container>
    );
}

export default Lineup;
