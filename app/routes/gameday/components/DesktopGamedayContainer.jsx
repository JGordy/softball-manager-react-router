import { useState, useMemo } from "react";
import {
    Box,
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

export default function DesktopGamedayContainer({
    game,
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
        game,
        playerChart: initialPlayerChart,
        team,
        initialLogs,
        gameFinal,
        isScorekeeper,
        isDesktop: true,
        players,
    });

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

    if (playerChart.length === 0) {
        return (
            <Card p="xl" radius="lg" ta="center">
                <Text fw={700} mb="xs">
                    Lineup Required
                </Text>
                <Text size="sm" c="dimmed">
                    You must create a lineup before scoring.
                </Text>
            </Card>
        );
    }

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
            {/* Page header — rendered here so menu has access to openSubModal */}
            <Group justify="space-between" align="center">
                <BackButton to={`/events/${game.$id}`} />
                <Title order={3}>Scoring & Stats</Title>
                {isScorekeeper ? (
                    <GamedayMenu
                        gameFinal={gameFinal}
                        score={score}
                        opponentScore={opponentScore}
                        onSubBatter={isOurBatting ? openSubModal : undefined}
                    />
                ) : (
                    <div style={{ minWidth: 40 }} />
                )}
            </Group>

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
                                gameFinal={gameFinal}
                                realtimeStatus={realtimeStatus}
                                isOurBatting={isOurBatting}
                                runners={runners}
                                currentBatter={currentBatter}
                                upcomingBatters={upcomingBatters}
                                logs={logs}
                            />
                            {logs.length > 0 && isOurBatting && !gameFinal && (
                                <LastPlayCard
                                    lastLog={logs[logs.length - 1]}
                                    onUndo={isScorekeeper ? undoLast : null}
                                    isSubmitting={isSubmitting}
                                    playerChart={playerChart}
                                />
                            )}
                        </Stack>
                    </Grid.Col>

                    {/* COLUMN 2: Action Pad */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack gap="md">
                            {!gameFinal &&
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
                            <Tabs.Tab value="plays">Plays</Tabs.Tab>
                            <Tabs.Tab value="boxscore">Box Score</Tabs.Tab>
                            <Tabs.Tab value="spray">Spray Chart</Tabs.Tab>
                            {gameFinal && (
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
                                    gameFinal={gameFinal}
                                />
                            </Tabs.Panel>

                            <Tabs.Panel value="spray" pt="md">
                                <ContactSprayChart
                                    hits={logs}
                                    showBattingSide={false}
                                    batters={batters}
                                />
                            </Tabs.Panel>

                            {gameFinal && (
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
