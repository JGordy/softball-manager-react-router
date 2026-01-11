import { useState } from "react";
import { Center, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import DeferredLoader from "@/components/DeferredLoader";

import GameStatsCard from "./stats/GameStatsCard";
import StatsDetailDrawer from "./stats/StatsDetailDrawer";

export default function PlayerStats({ statsPromise }) {
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedGame, setSelectedGame] = useState(null);

    const handleGameClick = (game, logs) => {
        setSelectedGame({ game, logs });
        open();
    };

    return (
        <DeferredLoader resolve={statsPromise}>
            {(data) => {
                const { logs = [], games = [] } = data || {};

                if (!logs.length) {
                    return (
                        <Center p="xl">
                            <Text c="dimmed">No stats available yet.</Text>
                        </Center>
                    );
                }

                // Group logs by gameId
                const logsByGame = logs.reduce((acc, log) => {
                    if (!acc[log.gameId]) {
                        acc[log.gameId] = [];
                    }
                    acc[log.gameId].push(log);
                    return acc;
                }, {});

                // Create a map of games for easy lookup
                const gamesMap = games.reduce((acc, game) => {
                    acc[game.$id] = game;
                    return acc;
                }, {});

                // Get unique game IDs from logs (or games), sort by date
                const sortedGameIds = Object.keys(logsByGame).sort((a, b) => {
                    const gameA = gamesMap[a];
                    const gameB = gamesMap[b];
                    if (!gameA || !gameB) return 0;
                    return new Date(gameB.gameDate) - new Date(gameA.gameDate);
                });

                // Take last 10 games
                const last10GameIds = sortedGameIds.slice(0, 10);

                return (
                    <Stack gap="md" mt="md">
                        {last10GameIds.map((gameId) => {
                            const game = gamesMap[gameId];
                            const gameLogs = logsByGame[gameId];

                            if (!game) return null;

                            return (
                                <GameStatsCard
                                    key={gameId}
                                    game={game}
                                    logs={gameLogs}
                                    onClick={() =>
                                        handleGameClick(game, gameLogs)
                                    }
                                />
                            );
                        })}

                        <StatsDetailDrawer
                            opened={opened}
                            onClose={close}
                            game={selectedGame?.game}
                            logs={selectedGame?.logs}
                        />
                    </Stack>
                );
            }}
        </DeferredLoader>
    );
}
