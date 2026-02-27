import { useEffect, useState } from "react";
import {
    Button,
    Center,
    Divider,
    Group,
    Paper,
    Skeleton,
    Stack,
    Text,
    Table,
} from "@mantine/core";
import { useMediaQuery, useDisclosure } from "@mantine/hooks";
import { IconMap2 } from "@tabler/icons-react";
import { useFetcher } from "react-router";

import ContactSprayChart from "@/components/ContactSprayChart";
import DrawerContainer from "@/components/DrawerContainer";

import { calculatePlayerStats } from "@/utils/stats";

import GameStatsCard from "./stats/GameStatsCard";
import StatsDetailDrawer from "./stats/StatsDetailDrawer";

export default function PlayerStats({ playerId }) {
    const fetcher = useFetcher();
    const isDesktop = useMediaQuery("(min-width: 62em)");

    const [opened, { open, close }] = useDisclosure(false);
    const [sprayOpened, { open: openSpray, close: closeSpray }] =
        useDisclosure(false);
    const [selectedGame, setSelectedGame] = useState(null);

    useEffect(() => {
        if (playerId && fetcher.state === "idle" && !fetcher.data) {
            fetcher.load(`/api/stats?userId=${playerId}`);
        }
    }, [playerId, fetcher.state, fetcher.data]);

    const handleGameClick = (game, logs) => {
        setSelectedGame({ game, logs });
        open();
    };

    const data = fetcher.data;

    if (data?.error) {
        return (
            <Center p="xl">
                <Text c="red">{data.error}</Text>
            </Center>
        );
    }

    if (!data) {
        return (
            <Stack gap="md" mt="md">
                <Paper withBorder p="md" radius="md">
                    {/* Title */}
                    <Skeleton height={20} width={150} mb="md" radius="xl" />

                    {/* 4 Stats */}
                    <Group my="xl" grow>
                        {[1, 2, 3, 4].map((i) => (
                            <Stack key={i} gap={2} align="center">
                                <Skeleton height={10} width={25} radius="xl" />
                                <Skeleton height={20} width={40} radius="xl" />
                            </Stack>
                        ))}
                    </Group>

                    {/* Table-like structure */}
                    <Stack gap="sm" mb="xl">
                        {/* Header mimic */}
                        <Group grow>
                            {[...Array(7)].map((_, i) => (
                                <Skeleton key={i} height={12} radius="xl" />
                            ))}
                        </Group>

                        <Divider />
                        {/* Row mimic */}
                        <Group grow>
                            {[...Array(7)].map((_, i) => (
                                <Skeleton key={i} height={16} radius="xl" />
                            ))}
                        </Group>
                    </Stack>

                    {/* Button */}
                    <Skeleton height={36} radius="sm" mt="xl" width="100%" />
                </Paper>
            </Stack>
        );
    }

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

    // Take up to the last 10 games
    const last10GameIds = sortedGameIds.slice(0, 10);

    const overallStats = calculatePlayerStats(logs);

    return (
        <Stack gap="md" mt="md">
            <Paper withBorder p="md" radius="md">
                <Text fw={700} mb="xs">
                    Last {last10GameIds.length} Games
                </Text>
                <Group my="md" grow>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            AVG
                        </Text>
                        <Text fw={700} size="lg">
                            {overallStats.calculated.avg}
                        </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            OBP
                        </Text>
                        <Text fw={700} size="lg">
                            {overallStats.calculated.obp}
                        </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            SLG
                        </Text>
                        <Text fw={700} size="lg">
                            {overallStats.calculated.slg}
                        </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
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
                            <Table.Td>{overallStats.doubles}</Table.Td>
                            <Table.Td>{overallStats.triples}</Table.Td>
                            <Table.Td>{overallStats.homeruns}</Table.Td>
                            <Table.Td>{overallStats.details.BB}</Table.Td>
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
                        onClick={() => handleGameClick(game, gameLogs)}
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
                size={isDesktop ? "md" : "xl"}
            >
                <ContactSprayChart hits={logs} />
            </DrawerContainer>
        </Stack>
    );
}
