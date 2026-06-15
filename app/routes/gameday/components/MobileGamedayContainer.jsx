import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import {
    Box,
    Button,
    Card,
    Group,
    LoadingOverlay,
    SegmentedControl,
    Stack,
    Tabs,
    Text,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertTriangle, IconUserMinus } from "@tabler/icons-react";

import TabsWrapper from "@/components/TabsWrapper";
import BackButton from "@/components/BackButton";
import ContactSprayChart from "@/components/ContactSprayChart";
import { isOpponentPlay } from "../utils/gamedayUtils";

import { useGamedayController } from "../hooks/useGamedayController";

import ScoreboardHeader from "./ScoreboardHeader";
import ActionPad from "./ActionPad";
import PlayHistoryList from "./PlayHistoryList";
import MobilePlayActionDrawer from "./MobilePlayActionDrawer";
import CurrentBatterCard from "./CurrentBatterCard";
import DefenseCard from "./DefenseCard";
import LastPlayCard from "./LastPlayCard";
import FieldingControls from "./FieldingControls";
import BoxScore from "@/components/BoxScore";
import UpNextCard from "./UpNextCard";
import SubPlayerDrawer from "./SubPlayerDrawer";
import RemovePlayerDrawer from "./RemovePlayerDrawer";
import GamedayMenu from "./GamedayMenu";
import AchievementsList from "./AchievementsList";
import EditPlayDrawer from "./EditPlayDrawer";
import SelectOpponentBatterDrawer from "./SelectOpponentBatterDrawer";
import ShareUrlButton from "@/components/ShareUrlButton";
import GameRecapView from "./GameRecapView";

import OnboardingTour from "@/components/OnboardingTour";
import {
    getOpponentScoringSteps,
    getScoringFlowSteps,
} from "../utils/onboardingSteps";

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
        handleSelectOpponentBatter,
        advanceHalfInning,
        initiateAction,
        completeAction,
        handleSubCurrentBatter,
        handleRemovePlayer,
        eligibleSubstitutes,
        playerChart,
        opponentChart,
        saveOpponentChart,
        opponentOrderIndex,
        opponentScoringMode,
        toggleOpponentScoringMode,
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

    const [tourInitialMode] = useState(opponentScoringMode);
    const [sprayChartTeam, setSprayChartTeam] = useState("us");
    const [boxScoreTeam, setBoxScoreTeam] = useState("us");

    // Auto-switch tabs to active team when batting side changes
    useEffect(() => {
        setSprayChartTeam(isOurBatting ? "us" : "them");
        setBoxScoreTeam(isOurBatting ? "us" : "them");
    }, [isOurBatting]);

    const sprayHits = useMemo(() => {
        return logs.filter(
            (l) =>
                isOpponentPlay(l, game.isHomeGame) ===
                (sprayChartTeam === "them"),
        );
    }, [logs, sprayChartTeam, game.isHomeGame]);

    const sprayBatters = useMemo(() => {
        if (sprayChartTeam === "us") {
            return batters;
        } else {
            const batterMap = new Map();
            opponentChart.forEach((slot, index) => {
                const label =
                    slot.firstName || slot.lastName
                        ? `${slot.firstName || ""} ${slot.lastName || ""}`.trim()
                        : `Batter ${index + 1}`;
                batterMap.set(slot.$id, { value: slot.$id, label });
            });
            return Array.from(batterMap.values());
        }
    }, [sprayChartTeam, batters, opponentChart]);

    const isGameFinal =
        game.gameFinal !== undefined ? !!game.gameFinal : gameFinal;

    const [subModalOpened, { open: openSubModal, close: closeSubModal }] =
        useDisclosure(false);
    const [
        removePlayerOpened,
        { open: openRemovePlayer, close: closeRemovePlayer },
    ] = useDisclosure(false);
    const [editLog, setEditLog] = useState(null);
    const [editDrawerOpened, { open: openEditDrawer, close: closeEditDrawer }] =
        useDisclosure(false);
    const [
        selectBatterOpened,
        { open: openSelectBatter, close: closeSelectBatter },
    ] = useDisclosure(false);

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
                            menuId="gameday-menu"
                            gameFinal={isGameFinal}
                            score={score}
                            opponentScore={opponentScore}
                            onSubBatter={
                                isOurBatting ? openSubModal : undefined
                            }
                            onRemovePlayer={
                                isOurBatting ? openRemovePlayer : undefined
                            }
                            opponentScoringMode={opponentScoringMode}
                            onToggleOpponentScoringMode={
                                toggleOpponentScoringMode
                            }
                            isOurBatting={isOurBatting}
                            opponentChart={opponentChart}
                            opponentOrderIndex={opponentOrderIndex}
                            onOpenSelectBatterDrawer={openSelectBatter}
                            opponentLineupLocked={game.opponentLineupLocked}
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
                    {isScorekeeper && !isGameFinal && !isOurBatting && (
                        <OnboardingTour
                            tourKey="gameday_opponent"
                            steps={getOpponentScoringSteps(tourInitialMode)}
                            user={user}
                            menuId="gameday-menu"
                            alwaysIncludeTargets={[
                                ".tour-gameday-menu-dropdown",
                                ".tour-gameday-menu-item-toggle-scoring-mode",
                                ".tour-gameday-menu-item-set-active-batter",
                                ".tour-gameday-menu-item-wrap-lineup",
                                ".tour-current-batter-card",
                                ".tour-fielding-out-btn",
                                ".tour-fielding-run-btn",
                                ".tour-fielding-skip-btn",
                            ]}
                            trackingSuffix="gameday_opponent"
                            disableScrolling={true}
                        />
                    )}
                    {isScorekeeper && !isGameFinal && isOurBatting && (
                        <OnboardingTour
                            tourKey="gameday_scoring_flow"
                            steps={getScoringFlowSteps()}
                            user={user}
                            alwaysIncludeTargets={[
                                ".tour-action-1b",
                                ".tour-spray-field",
                                ".tour-runner-advancement-dnd",
                                ".tour-confirm-play-btn",
                                ".tour-last-play-card",
                            ]}
                            trackingSuffix="gameday_scoring_flow"
                            disableScrolling={true}
                        />
                    )}
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
                                            {isOurBatting ||
                                            opponentScoringMode ===
                                                "Detailed" ? (
                                                <>
                                                    <CurrentBatterCard
                                                        currentBatter={
                                                            currentBatter
                                                        }
                                                        logs={logs}
                                                        isOpponent={
                                                            !isOurBatting
                                                        }
                                                        onNotesChange={(
                                                            notes,
                                                        ) => {
                                                            if (!isOurBatting) {
                                                                const updated =
                                                                    [
                                                                        ...opponentChart,
                                                                    ];
                                                                while (
                                                                    updated.length <=
                                                                    opponentOrderIndex
                                                                ) {
                                                                    const idx =
                                                                        updated.length;
                                                                    updated.push(
                                                                        {
                                                                            $id: `OPP_BAT_${idx + 1}`,
                                                                            firstName:
                                                                                "Batter",
                                                                            lastName: `${idx + 1}`,
                                                                            substitutions:
                                                                                [],
                                                                        },
                                                                    );
                                                                }
                                                                updated[
                                                                    opponentOrderIndex
                                                                ] = {
                                                                    ...updated[
                                                                        opponentOrderIndex
                                                                    ],
                                                                    notes,
                                                                };
                                                                saveOpponentChart(
                                                                    updated,
                                                                );
                                                            }
                                                        }}
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
                                            {isOurBatting &&
                                            currentBatter?.removed &&
                                            currentBatter?.removalType ===
                                                "auto-out" ? (
                                                <Card
                                                    p="md"
                                                    radius="lg"
                                                    bg="orange.9"
                                                    c="white"
                                                    ta="center"
                                                >
                                                    <Stack
                                                        align="center"
                                                        gap="sm"
                                                    >
                                                        <IconAlertTriangle
                                                            size={32}
                                                        />
                                                        <Text fw={700}>
                                                            Injured Player -
                                                            Automatic Out
                                                        </Text>
                                                        <Text
                                                            size="xs"
                                                            opacity={0.8}
                                                        >
                                                            This slot is marked
                                                            for automatic out
                                                            due to player
                                                            injury. Click below
                                                            to record the out.
                                                        </Text>
                                                        <Button
                                                            color="red"
                                                            onClick={() =>
                                                                completeAction(
                                                                    "injury_auto_out",
                                                                )
                                                            }
                                                            leftSection={
                                                                <IconUserMinus
                                                                    size={16}
                                                                />
                                                            }
                                                            fullWidth
                                                            size="md"
                                                        >
                                                            Record Automatic Out
                                                        </Button>
                                                    </Stack>
                                                </Card>
                                            ) : isOurBatting ||
                                              opponentScoringMode ===
                                                  "Detailed" ? (
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

                                    {logs.length > 0 && (
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
                                                isHomeGame={game.isHomeGame}
                                            />
                                        </Box>
                                    )}
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="plays" pt="md">
                                <Stack gap="md">
                                    {!isGameFinal && (
                                        <>
                                            {isOurBatting ||
                                            opponentScoringMode ===
                                                "Detailed" ? (
                                                <CurrentBatterCard
                                                    currentBatter={
                                                        currentBatter
                                                    }
                                                    logs={logs}
                                                    isOpponent={!isOurBatting}
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
                                        opponentName={game.opponent}
                                        isHomeGame={game.isHomeGame}
                                    />
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="boxscore" pt="md">
                                <Stack gap="sm">
                                    <SegmentedControl
                                        value={boxScoreTeam}
                                        onChange={setBoxScoreTeam}
                                        color={
                                            boxScoreTeam === "us"
                                                ? "blue"
                                                : "red"
                                        }
                                        data={[
                                            { label: team.name, value: "us" },
                                            {
                                                label:
                                                    game.opponent || "Opponent",
                                                value: "them",
                                            },
                                        ]}
                                        fullWidth
                                    />
                                    <BoxScore
                                        logs={logs}
                                        playerChart={
                                            boxScoreTeam === "us"
                                                ? playerChart
                                                : opponentChart
                                        }
                                        currentBatter={currentBatter}
                                        gameFinal={isGameFinal}
                                        isOpponent={boxScoreTeam === "them"}
                                        isHomeGame={game.isHomeGame}
                                    />
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="spray" pt="md">
                                <Stack gap="sm">
                                    <SegmentedControl
                                        value={sprayChartTeam}
                                        onChange={setSprayChartTeam}
                                        color={
                                            sprayChartTeam === "us"
                                                ? "blue"
                                                : "red"
                                        }
                                        data={[
                                            { label: team.name, value: "us" },
                                            {
                                                label:
                                                    game.opponent || "Opponent",
                                                value: "them",
                                            },
                                        ]}
                                        fullWidth
                                    />
                                    <ContactSprayChart
                                        hits={sprayHits}
                                        showBattingSide={false}
                                        batters={sprayBatters}
                                    />
                                </Stack>
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

            <RemovePlayerDrawer
                opened={removePlayerOpened}
                onClose={closeRemovePlayer}
                playerChart={playerChart}
                onConfirmRemove={handleRemovePlayer}
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

            <SelectOpponentBatterDrawer
                opened={selectBatterOpened}
                onClose={closeSelectBatter}
                opponentOrderIndex={opponentOrderIndex}
                onSelectOpponentBatter={handleSelectOpponentBatter}
                opponentChart={opponentChart}
            />
        </Stack>
    );
}
