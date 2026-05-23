import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
    Box,
    Button,
    Card,
    Group,
    LoadingOverlay,
    Stack,
    Tabs,
    Text,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import TabsWrapper from "@/components/TabsWrapper";
import BackButton from "@/components/BackButton";
import ContactSprayChart from "@/components/ContactSprayChart";

import { useGamedayController } from "../hooks/useGamedayController";

import ScoreboardHeader from "./ScoreboardHeader";
import ActionPad from "./ActionPad";
import PlayHistoryList from "./PlayHistoryList";
import MobilePlayActionDrawer from "./MobilePlayActionDrawer";
import CurrentBatterCard from "./CurrentBatterCard";
import DefenseCard from "./DefenseCard";
import LastPlayCard from "./LastPlayCard";
import FieldingControls from "./FieldingControls";
import BoxScore from "./BoxScore";
import UpNextCard from "./UpNextCard";
import SubPlayerDrawer from "./SubPlayerDrawer";
import GamedayMenu from "./GamedayMenu";
import AchievementsList from "./AchievementsList";
import EditPlayDrawer from "./EditPlayDrawer";
import ShareUrlButton from "@/components/ShareUrlButton";
import GameRecapView from "./GameRecapView";

export default function MobileGamedayContainer({
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
                <>
                    <ScoreboardHeader
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
                    />

                    <Box pos="relative">
                        <LoadingOverlay
                            visible={isSyncing}
                            overlayProps={{
                                radius: "lg",
                                blur: 1,
                                opacity: 0.1,
                            }}
                            loaderProps={{ color: "blue", type: "dots" }}
                            zIndex={100}
                        />
                        <TabsWrapper
                            value={activeTab}
                            onChange={handleTabChange}
                            mt={0}
                        >
                            {isGameFinal && (game.recap || logs.length > 0) && (
                                <Tabs.Tab value="recap">Recap</Tabs.Tab>
                            )}
                            {!isGameFinal && (
                                <Tabs.Tab value="live">Live</Tabs.Tab>
                            )}
                            <Tabs.Tab value="plays">Plays</Tabs.Tab>
                            <Tabs.Tab value="boxscore">Box Score</Tabs.Tab>
                            <Tabs.Tab value="spray">Spray</Tabs.Tab>
                            {isGameFinal && (
                                <Tabs.Tab value="achievements">
                                    Achievements
                                </Tabs.Tab>
                            )}

                            <Tabs.Panel value="live" pt="md">
                                <Stack gap="md">
                                    {!isGameFinal && (
                                        <>
                                            {isOurBatting ? (
                                                <>
                                                    <CurrentBatterCard
                                                        currentBatter={
                                                            currentBatter
                                                        }
                                                        logs={logs}
                                                    />
                                                    <UpNextCard
                                                        upcomingBatters={
                                                            upcomingBatters
                                                        }
                                                    />
                                                </>
                                            ) : (
                                                <DefenseCard
                                                    teamName={team.name}
                                                    dueUpBatters={dueUpBatters}
                                                />
                                            )}
                                        </>
                                    )}

                                    {isScorekeeper && !isGameFinal && (
                                        <Stack flex={1} gap="md">
                                            {isOurBatting ? (
                                                <ActionPad
                                                    onAction={initiateAction}
                                                    runners={runners}
                                                    outs={outs}
                                                />
                                            ) : (
                                                <FieldingControls
                                                    onOut={handleOpponentOut}
                                                    onRun={handleOpponentRun}
                                                    onSkip={advanceHalfInning}
                                                />
                                            )}
                                        </Stack>
                                    )}

                                    {logs.length > 0 && isOurBatting && (
                                        <Box>
                                            <LastPlayCard
                                                lastLog={logs[logs.length - 1]}
                                                onUndo={
                                                    isScorekeeper
                                                        ? undoLast
                                                        : null
                                                }
                                                isSubmitting={isSubmitting}
                                                playerChart={playerChart}
                                            />
                                        </Box>
                                    )}
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="plays" pt="md">
                                <Stack gap="md">
                                    {!isGameFinal && (
                                        <>
                                            {isOurBatting ? (
                                                <CurrentBatterCard
                                                    currentBatter={
                                                        currentBatter
                                                    }
                                                    logs={logs}
                                                />
                                            ) : (
                                                <DefenseCard
                                                    teamName={team.name}
                                                    dueUpBatters={dueUpBatters}
                                                />
                                            )}
                                        </>
                                    )}
                                    <PlayHistoryList
                                        logs={logs}
                                        playerChart={playerChart}
                                        isScorekeeper={isScorekeeper}
                                        onEditPlay={handleEditPlay}
                                    />
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

                            {isGameFinal && (game.recap || logs.length > 0) && (
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
                    </Box>
                </>
            )}

            <MobilePlayActionDrawer
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
