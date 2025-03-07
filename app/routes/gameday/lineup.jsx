import { useState, useEffect } from 'react';

import {
    Button,
    Center,
    Container,
    Group,
    Text,
} from '@mantine/core';

import PlayerChart from '@components/PlayerChart';

// import { IconWand, IconPrinter, IconSparkles } from '@tabler/icons-react';

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

            const response = await fetch('/api/lineup', {
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
        <Container p="md" mih="90vh">
            <Center>
                <Group position="center" spacing="md" mt="xl" mb="xl">
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
                        {/* <IconSparkles size={18} /> */}
                        Generate Lineup
                    </Button>
                </Group>
            </Center>
            <Center>
                {isLoading && <Text c="gray.2">Generating batting and fielding charts...</Text>}
                {error && <Text c="red.5">{error?.message || error}</Text>}
            </Center>
            {playerChart && (
                <>
                    <PlayerChart
                        playerChart={playerChart}
                        setPlayerChart={setPlayerChart}
                    />
                    <Button onClick={handlePrint}>
                        {/* <IconPrinter size={18} /> */}
                        Print/Download
                    </Button>
                </>
            )}
        </Container>
    );
}

export default Lineup;
