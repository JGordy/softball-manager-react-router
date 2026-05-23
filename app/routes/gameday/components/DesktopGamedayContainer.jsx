import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
    Box,
    Button,
    Card,
    Grid,
    Group,
    LoadingOverlay,
    Stack,
    Tabs,
    Text,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import BackButton from "@/components/BackButton";
import TabsWrapper from "@/components/TabsWrapper";
import ContactSprayChart from "@/components/ContactSprayChart";

import { useGamedayController } from "../hooks/useGamedayController";

import BoxScore from "./BoxScore";
import CompactMatchupCard from "./CompactMatchupCard";
import ActionPad from "./ActionPad";
import PlayHistoryList from "./PlayHistoryList";
import DefenseCard from "./DefenseCard";
import LastPlayCard from "./LastPlayCard";
import FieldingControls from "./FieldingControls";
import DesktopPlayActionDrawer from "./DesktopPlayActionDrawer";
import SubPlayerDrawer from "./SubPlayerDrawer";
import GamedayMenu from "./GamedayMenu";
import AchievementsList from "./AchievementsList";
import EditPlayDrawer from "./EditPlayDrawer";
import ShareUrlButton from "@/components/ShareUrlButton";
import GameRecapView from "./GameRecapView";

export default function DesktopGamedayContainer({
    game: staticGame,
    playerChart: initialPlayerChart,
    team,
    initialLogs = [],
    gameFinal = false,
    isScorekeeper = false,
    players = [],
    user,
    achievements = [],
}) {
    const {
        game,
        logs,
        realtimeStatus,
        activeTab,
        handleTabChange,
        batters,
        isSyncing,
        isSubmitting,
        inning,
        halfInning,
        outs,
        score,
        opponentScore,
        runners,
        currentBatter,
        upcomingBatters,
        dueUpBatters,
        isOurBatting,
        pendingAction,
        drawerOpened,
        closeDrawer,
        handleOpponentRun,
        handleOpponentOut,
        advanceHalfInning,
        initiateAction,
        completeAction,
        handleSubCurrentBatter,
        eligibleSubstitutes,
        playerChart,
        undoLast,
        updateAction,
    } = useGamedayController({
        game: staticGame,
        playerChart: initialPlayerChart,
        team,
        initialLogs,
        gameFinal,
        isScorekeeper,
        isDesktop: true,
        players,
    });

    const isGameFinal =
        game.gameFinal !== undefined ? !!game.gameFinal : gameFinal;

    const [subModalOpened, { open: openSubModal, close: closeSubModal }] =
        useDisclosure(false);
    const [editLog, setEditLog] = useState(null);
    const [editDrawerOpened, { open: openEditDrawer, close: closeEditDrawer }] =
        useDisclosure(false);

    const previousLog = useMemo(() => {
        if (!editLog) return null;
        const idx = logs.findIndex((l) => l.$id === editLog.$id);
        return idx > 0 ? logs[idx - 1] : null;
    }, [editLog, logs]);

    const handleEditPlay = (log) => {
        setEditLog(log);
        openEditDrawer();
    };

    const handleCloseEditDrawer = () => {
        closeEditDrawer();
        setEditLog(null);
    };

    const handleSaveEdit = (logId, updatedData) => {
        updateAction(logId, updatedData);
        closeEditDrawer();
        setEditLog(null);
    };

    return (
        <Stack gap="md">
            {/* Page header — 3-column layout ensures title stays centered */}
            <Group wrap="nowrap" align="center">
                <Box flex={1}>
                    <BackButton to={`/events/${game.$id}`} />
                </Box>

                <Title order={3} style={{ whiteSpace: "nowrap" }}>
                    Scoring & Stats
                </Title>

                <Group flex={1} justify="flex-end" gap="xs" wrap="nowrap">
                    <ShareUrlButton />
                    {isScorekeeper ? (
                        <GamedayMenu
                            gameFinal={isGameFinal}
                            score={score}
                            opponentScore={opponentScore}
                            onSubBatter={
                                isOurBatting ? openSubModal : undefined
                            }
                        />
                    ) : (
                        <div style={{ minWidth: 40 }} />
                    )}
                </Group>
            </Group>

            {playerChart.length === 0 ? (
                <Card p="xl" radius="lg" ta="center">
                    <Text fw={700} mb="xs">
                        Lineup Required
                    </Text>
                    <Text size="sm" c="dimmed" mb="md">
                        You must create a lineup before scoring.
                    </Text>
                    {isScorekeeper && (
                        <Button
                            component={Link}
                            to={`/events/${game.$id}/lineup`}
                            variant="filled"
                            color="lime"
                            mt="xs"
                        >
                            Create Lineup
                        </Button>
                    )}
                </Card>
            ) : (
                <Box pos="relative">
                    <LoadingOverlay
                        visible={isSyncing}
                        overlayProps={{ radius: "lg", blur: 1, opacity: 0.1 }}
                        loaderProps={{ color: "blue", type: "dots" }}
                        zIndex={100}
                    />

                    <Grid gutter="xl" mt="md" align="flex-start">
                        {/* COLUMN 1: Matchup */}
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Stack gap="md">
                                <CompactMatchupCard
                                    score={score}
                                    opponentScore={opponentScore}
                                    inning={inning}
                                    halfInning={halfInning}
                                    outs={outs}
                                    teamName={team.name}
                                    opponentName={game.opponent}
                                    gameFinal={isGameFinal}
                                    realtimeStatus={realtimeStatus}
                                    isOurBatting={isOurBatting}
                                    runners={runners}
                                    currentBatter={currentBatter}
                                    upcomingBatters={upcomingBatters}
                                    logs={logs}
                                />
                                {logs.length > 0 &&
                                    isOurBatting &&
                                    !isGameFinal && (
                                        <LastPlayCard
                                            lastLog={logs[logs.length - 1]}
                                            onUndo={
                                                isScorekeeper ? undoLast : null
                                            }
                                            isSubmitting={isSubmitting}
                                            playerChart={playerChart}
                                        />
                                    )}
                            </Stack>
                        </Grid.Col>

                        {/* COLUMN 2: Action Pad */}
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Stack gap="md">
                                {!isGameFinal &&
                                    (isOurBatting ? (
                                        isScorekeeper && (
                                            <Card radius="lg">
                                                <ActionPad
                                                    onAction={initiateAction}
                                                    runners={runners}
                                                    outs={outs}
                                                />
                                            </Card>
                                        )
                                    ) : (
                                        <>
                                            <DefenseCard
                                                teamName={team.name}
                                                dueUpBatters={dueUpBatters}
                                            />
                                            {isScorekeeper && (
                                                <FieldingControls
                                                    onOut={handleOpponentOut}
                                                    onRun={handleOpponentRun}
                                                    onSkip={advanceHalfInning}
                                                />
                                            )}
                                        </>
                                    ))}
                            </Stack>
                        </Grid.Col>

                        {/* COLUMN 3: Tabs */}
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <TabsWrapper
                                value={activeTab}
                                onChange={(val) => handleTabChange(val)}
                                mt={0}
                                size="sm"
                            >
                                {isGameFinal &&
                                    (game.recap || logs.length > 0) && (
                                        <Tabs.Tab value="recap">Recap</Tabs.Tab>
                                    )}
                                <Tabs.Tab value="plays">Plays</Tabs.Tab>
                                <Tabs.Tab value="boxscore">Box Score</Tabs.Tab>
                                <Tabs.Tab value="spray">Spray Chart</Tabs.Tab>
                                {isGameFinal && (
                                    <Tabs.Tab value="achievements">
                                        Achievements
                                    </Tabs.Tab>
                                )}

                                <Tabs.Panel value="plays" pt="md">
                                    <Stack gap="md">
                                        <Card radius="md" p="xs">
                                            <PlayHistoryList
                                                logs={logs}
                                                playerChart={playerChart}
                                                isScorekeeper={isScorekeeper}
                                                onEditPlay={handleEditPlay}
                                            />
                                        </Card>
                                    </Stack>
                                </Tabs.Panel>

                                <Tabs.Panel value="boxscore" pt="md">
                                    <BoxScore
                                        logs={logs}
                                        playerChart={playerChart}
                                        currentBatter={currentBatter}
                                        gameFinal={isGameFinal}
                                    />
                                </Tabs.Panel>

                                <Tabs.Panel value="spray" pt="md">
                                    <ContactSprayChart
                                        hits={logs}
                                        showBattingSide={false}
                                        batters={batters}
                                    />
                                </Tabs.Panel>

                                {isGameFinal &&
                                    (game.recap || logs.length > 0) && (
                                        <Tabs.Panel value="recap" pt="md">
                                            <GameRecapView
                                                recap={game.recap}
                                                logs={logs}
                                                isScorekeeper={isScorekeeper}
                                            />
                                        </Tabs.Panel>
                                    )}
                                {isGameFinal && (
                                    <Tabs.Panel value="achievements" pt="md">
                                        <AchievementsList
                                            achievements={achievements}
                                            players={players}
                                            user={user}
                                        />
                                    </Tabs.Panel>
                                )}
                            </TabsWrapper>
                        </Grid.Col>
                    </Grid>
                </Box>
            )}

            <DesktopPlayActionDrawer
                opened={drawerOpened}
                onClose={closeDrawer}
                actionType={pendingAction}
                runners={runners}
                onSelect={(payload) => completeAction(pendingAction, payload)}
                playerChart={playerChart}
                currentBatter={currentBatter}
                outs={outs}
            />

            <SubPlayerDrawer
                opened={subModalOpened}
                onClose={closeSubModal}
                currentSlot={currentBatter}
                eligibleSubstitutes={eligibleSubstitutes}
                onConfirmSub={handleSubCurrentBatter}
            />

            <EditPlayDrawer
                key={editLog?.$id}
                opened={editDrawerOpened}
                onClose={handleCloseEditDrawer}
                log={editLog}
                previousLog={previousLog}
                playerChart={playerChart}
                onSave={handleSaveEdit}
                isSubmitting={isSubmitting}
            />
        </Stack>
    );
}
