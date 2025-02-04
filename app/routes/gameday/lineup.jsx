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

export async function clientLoader() {
    try {
        const response = await fetch('/players.json', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { error };
    }
}

function Lineup({ loaderData, actionData }) {
    const { players, error: loaderError } = loaderData;

    const [playerChart, setPlayerChart] = useState();
    const [error, setError] = useState();
    const [isLoading, setIsLoading] = useState();

    useEffect(() => {
        if (actionData?.generatedChart) {
            setPlayerChart(actionData.generatedChart);
            setIsLoading(false);
        }
        if (actionData?.error) {
            console.error(actionData.error);
            setIsLoading(false);
            setError(actionData.error);
        }
        if (loaderError) {
            setError(loaderError);
        }
    }, [actionData, loaderData]);


    // Create batting order and fielding chart
    const handleCreateLineup = () => {
        setPlayerChart();
        setIsLoading(true);

        const batting = createBattingOrder(players);

        if (batting?.length > 0) {
            const fieldingChart = createFieldingChart(batting);

            if (fieldingChart?.length > 0) {
                setPlayerChart(fieldingChart);
            }
        }
        setIsLoading(false);
    };

    // Generate Lineup and fielding chart using generative AI
    const handleGenerateLineup = async () => {
        setPlayerChart();
        setIsLoading(true);
        try {

            const response = await fetch('/api/generate/lineup', {
                method: 'POST',
                body: JSON.stringify(players),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
            }

            const actionData = await response.json();

            setPlayerChart(actionData.generatedChart);
            setIsLoading(false);
        } catch (error) {
            console.error("Error generating lineup:", error);
            setIsLoading(false);
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
                        disabled={!players}
                        loading={isLoading}
                        onClick={handleGenerateLineup}
                    >
                        <IconWand size={18} />
                        Generate Lineup
                    </Button>
                </Group>
            </Center>
            {isLoading && <div>Generating batting and fielding charts...</div>}
            {error && <div>Error: {error?.message || error}</div>}
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
