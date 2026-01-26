import { useState } from "react";
import {
    Center,
    Group,
    Stack,
    Text,
    Table,
    Paper,
    Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMap2 } from "@tabler/icons-react";

import ContactSprayChart from "@/components/ContactSprayChart";
import DrawerContainer from "@/components/DrawerContainer";

import DeferredLoader from "@/components/DeferredLoader";
import { calculatePlayerStats } from "@/utils/stats";

import GameStatsCard from "./stats/GameStatsCard";
import StatsDetailDrawer from "./stats/StatsDetailDrawer";

export default function PlayerStats({ statsPromise }) {
    const [opened, { open, close }] = useDisclosure(false);
    const [sprayOpened, { open: openSpray, close: closeSpray }] =
        useDisclosure(false);
    const [selectedGame, setSelectedGame] = useState(null);

    const handleGameClick = (game, logs) => {
        setSelectedGame({ game, logs });
        open();
    };

    return (
        <DeferredLoader resolve={statsPromise}>
            {(data) => {
                const { logs = [], games = [], teams = [] } = data || {};

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
                    game.team = teams.find((team) => team.$id === game.teamId);
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

                const overallStats = calculatePlayerStats(logs);

                return (
                    <Stack gap="md" mt="md">
                        <Paper withBorder p="md" radius="md">
                            <Text fw={700} mb="xs">
                                Last {sortedGameIds.length} Games
                            </Text>
                            <Group my="md" grow>
                                <Stack gap={0} align="center">
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        tt="uppercase"
                                        fw={700}
                                    >
                                        AVG
                                    </Text>
                                    <Text fw={700} size="lg">
                                        {overallStats.calculated.avg}
                                    </Text>
                                </Stack>
                                <Stack gap={0} align="center">
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        tt="uppercase"
                                        fw={700}
                                    >
                                        OBP
                                    </Text>
                                    <Text fw={700} size="lg">
                                        {overallStats.calculated.obp}
                                    </Text>
                                </Stack>
                                <Stack gap={0} align="center">
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        tt="uppercase"
                                        fw={700}
                                    >
                                        SLG
                                    </Text>
                                    <Text fw={700} size="lg">
                                        {overallStats.calculated.slg}
                                    </Text>
                                </Stack>
                                <Stack gap={0} align="center">
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        tt="uppercase"
                                        fw={700}
                                    >
                                        OPS
                                    </Text>
                                    <Text fw={700} size="lg">
                                        {overallStats.calculated.ops}
                                    </Text>
                                </Stack>
                            </Group>
                            <Table horizontalSpacing="sm" verticalSpacing="xs">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>AB</Table.Th>
                                        <Table.Th>H</Table.Th>
                                        <Table.Th>RBI</Table.Th>
                                        <Table.Th>2B</Table.Th>
                                        <Table.Th>3B</Table.Th>
                                        <Table.Th>HR</Table.Th>
                                        <Table.Th>BB</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td>{overallStats.ab}</Table.Td>
                                        <Table.Td>{overallStats.hits}</Table.Td>
                                        <Table.Td>{overallStats.rbi}</Table.Td>
                                        <Table.Td>
                                            {overallStats.doubles}
                                        </Table.Td>
                                        <Table.Td>
                                            {overallStats.triples}
                                        </Table.Td>
                                        <Table.Td>
                                            {overallStats.homeruns}
                                        </Table.Td>
                                        <Table.Td>
                                            {overallStats.details.BB}
                                        </Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                            <Button
                                leftSection={<IconMap2 size={16} />}
                                variant="light"
                                onClick={openSpray}
                                mt="xs"
                                fullWidth
                            >
                                View Spray Chart
                            </Button>
                        </Paper>

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

                        <DrawerContainer
                            opened={sprayOpened}
                            onClose={closeSpray}
                            title="Contact Spray Chart"
                            size="xl"
                        >
                            <ContactSprayChart hits={logs} />
                        </DrawerContainer>
                    </Stack>
                );
            }}
        </DeferredLoader>
    );
}
