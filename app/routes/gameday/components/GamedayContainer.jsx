import { useState, useEffect, useCallback } from "react";
import { useFetcher, useLocation, useNavigate } from "react-router";

import { Card, Group, Stack, Text, Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import TabsWrapper from "@/components/TabsWrapper";
import { useGameUpdates } from "@/hooks/useGameUpdates";

import { useGameState } from "../hooks/useGameState";

import { UI_BATTED_OUTS, UI_WALKS } from "@/constants/scoring";

import {
    getEventDescription,
    handleWalk,
    handleRunnerResults,
} from "../utils/gamedayUtils";

import { showNotification } from "@/utils/showNotification";

import ScoreboardHeader from "./ScoreboardHeader";
import DiamondView from "./DiamondView";
import ActionPad from "./ActionPad";
import PlayHistoryList from "./PlayHistoryList";
import PlayActionDrawer from "./PlayActionDrawer";
import CurrentBatterCard from "./CurrentBatterCard";
import DefenseCard from "./DefenseCard";
import LastPlayCard from "./LastPlayCard";
import FieldingControls from "./FieldingControls";
import BoxScore from "./BoxScore";
import OnDeckCard from "./OnDeckCard";

/**
 * Handles automatic outs for strikeouts.
 * Runners stay in place.
 */
function handleAutomaticOut(runners) {
    return {
        newRunners: { ...runners, scored: [] },
        runsOnPlay: 0,
        outsRecorded: 1,
    };
}

export default function GamedayContainer({
    game,
    playerChart,
    team,
    initialLogs = [],
    gameFinal = false,
    isManager = false,
}) {
    const fetcher = useFetcher();
    const location = useLocation();
    const navigate = useNavigate();
    const [logs, setLogs] = useState(initialLogs);

    // Real-time updates for game logs
    const { status: realtimeStatus, error: realtimeError } = useGameUpdates(
        game.$id,
        {
            onNewLog: (newLog) => {
                setLogs((prev) => {
                    const logExists = prev.some(
                        (log) => log.$id === newLog.$id,
                    );
                    if (logExists) return prev;
                    return [...prev, newLog];
                });
            },
            onUpdateLog: (updatedLog) => {
                setLogs((prev) =>
                    prev.map((log) =>
                        log.$id === updatedLog.$id ? updatedLog : log,
                    ),
                );
            },
            onDeleteLog: (deletedLogId) => {
                setLogs((prev) =>
                    prev.filter((log) => log.$id !== deletedLogId),
                );
            },
            gameDate: game.gameDate,
            gameFinal,
        },
    );

    // Initialize tab from URL hash if present, otherwise default based on gameFinal
    const getInitialTab = () => {
        const hash = location?.hash?.replace(/^#/, "") || null;
        const validTabs = ["live", "plays", "boxscore"];
        if (hash && validTabs.includes(hash)) {
            // If game is final, don't allow 'live' tab
            if (gameFinal && hash === "live") return "plays";
            return hash;
        }
        return gameFinal ? "plays" : "live";
    };

    const [activeTab, setActiveTab] = useState(() => getInitialTab());

    // Update URL hash when tab changes (without page refresh)
    const handleTabChange = useCallback(
        (value) => {
            if (!value) return;
            if (value === activeTab) return;

            // Update state immediately for instant tab switch
            setActiveTab(value);

            // Then update URL in background
            const newHash = `#${value}`;
            const url = `${location.pathname}${location.search}${newHash}`;
            navigate(url, { replace: false });
        },
        [activeTab, location.pathname, location.search, navigate],
    );

    // Sync activeTab with gameFinal status
    useEffect(() => {
        if (gameFinal && activeTab === "live") {
            const nextTab = "plays";
            setActiveTab(nextTab);
            const newHash = `#${nextTab}`;
            const url = `${location.pathname}${location.search}${newHash}`;
            navigate(url, { replace: false });
        }
    }, [gameFinal, location.pathname, location.search, navigate]);

    // Keep tab state in sync when location.hash changes (back/forward navigation)
    useEffect(() => {
        const hash = location?.hash?.replace(/^#/, "") || null;
        const validTabs = ["live", "plays", "boxscore"];

        // Do not switch to "live" tab when the game is final
        if (hash === "live" && gameFinal) {
            return;
        }

        if (hash && validTabs.includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash, gameFinal]);

    // Update logs when fetcher returns a new log successfully
    useEffect(() => {
        if (
            fetcher.data?.success &&
            fetcher.data?.log &&
            fetcher.state === "idle"
        ) {
            // New log created - append it if it's not already in the list
            setLogs((prev) => {
                const logExists = prev.some(
                    (log) => log.$id === fetcher.data.log.$id,
                );
                if (logExists) return prev;
                return [...prev, fetcher.data.log];
            });
        }
    }, [fetcher.data, fetcher.state]);

    // Sync initialLogs when they change
    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    // Show notification on realtime error for debugging on mobile
    useEffect(() => {
        if (realtimeStatus === "error" && realtimeError) {
            showNotification({
                title: "Realtime Debug",
                message: realtimeError,
                variant: "error",
                autoClose: false,
            });
        }
    }, [realtimeStatus, realtimeError]);

    // Show notification on fetcher error for debugging on mobile
    useEffect(() => {
        if (fetcher.data?.error) {
            showNotification({
                title: "Action Debug",
                message: fetcher.data.error,
                variant: "error",
                autoClose: false,
            });
        }
    }, [fetcher.data]);

    // Use custom hook for game state management and syncing
    const {
        inning,
        setInning,
        halfInning,
        setHalfInning,
        outs,
        setOuts,
        score,
        setScore,
        opponentScore,
        setOpponentScore,
        runners,
        setRunners,
        battingOrderIndex,
        setBattingOrderIndex,
    } = useGameState({ logs, game, playerChart });

    const [pendingAction, setPendingAction] = useState(null);
    const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
        useDisclosure(false);

    // Helper: Is it currently our team's turn to bat?
    // Away (isHomeGame=false) bats in Top, Home (isHomeGame=true) bats in Bottom.
    const isOurBatting = game.isHomeGame
        ? halfInning === "bottom"
        : halfInning === "top";

    const currentBatter = playerChart[battingOrderIndex];
    const onDeckBatter =
        playerChart.length > 0
            ? playerChart[(battingOrderIndex + 1) % playerChart.length]
            : undefined;

    const advanceHalfInning = () => {
        setOuts(0);
        setRunners({ first: null, second: null, third: null });
        if (halfInning === "top") {
            setHalfInning("bottom");
        } else {
            setHalfInning("top");
            setInning((prev) => prev + 1);
        }
    };

    const handleOpponentRun = () => {
        const newOpponentScore = opponentScore + 1;
        setOpponentScore(newOpponentScore);
        fetcher.submit(
            { _action: "update-game-score", opponentScore: newOpponentScore },
            { method: "post" },
        );
    };

    const handleOpponentOut = () => {
        const newOuts = outs + 1;
        if (newOuts >= 3) {
            advanceHalfInning();
        } else {
            setOuts(newOuts);
        }
    };

    const initiateAction = (actionType) => {
        // Direct actions that don't need a position
        if (["K", ...UI_WALKS].includes(actionType)) {
            completeAction(actionType);
        } else {
            setPendingAction(actionType);
            openDrawer();
        }
    };

    const completeAction = (actionType, payload = null) => {
        const position = payload?.position || null;
        const runnerResults = payload?.runnerResults || null;
        const hitCoordinates = payload?.hitCoordinates || { x: null, y: null };
        const hitLocation = payload?.hitLocation || null;
        const battingSide = payload?.battingSide || "right";

        const batter = playerChart[battingOrderIndex];
        const batterName = `${batter.firstName} ${batter.lastName}`;
        const description = getEventDescription(
            actionType,
            batterName,
            position,
            runnerResults,
            hitLocation,
        );

        let result;

        // Route to appropriate handler based on event type
        if (UI_WALKS.includes(actionType)) {
            result = handleWalk(runners, batter.$id);
        } else if (runnerResults) {
            // Manual overrides from Drawer (Used for Hits, Errors, and Batted Outs)
            result = handleRunnerResults(runnerResults, runners, batter.$id);
        } else if (actionType === "K" || UI_BATTED_OUTS.includes(actionType)) {
            result = handleAutomaticOut(runners);
        } else {
            // Unexpected case: preserve existing base state to avoid data corruption
            console.warn(
                `Unexpected action type without runner results: ${actionType}`,
            );
            result = {
                newRunners: { ...runners },
                runsOnPlay: 0,
                outsRecorded: 0,
            };
        }

        const { newRunners, runsOnPlay, outsRecorded } = result;

        // Submit to server
        fetcher.submit(
            {
                _action: "log-game-event",
                teamId: team.$id,
                inning,
                halfInning,
                playerId: batter.$id,
                eventType: actionType,
                rbi: runsOnPlay,
                outsOnPlay: outsRecorded,
                description,
                hitX: hitCoordinates.x,
                hitY: hitCoordinates.y,
                hitLocation,
                battingSide,
                baseState: JSON.stringify(newRunners),
            },
            { method: "post" },
        );

        // Update local state for immediate feedback
        const newTotalOuts = outs + outsRecorded;
        if (newTotalOuts >= 3) {
            advanceHalfInning();
        } else {
            setOuts(newTotalOuts);
            setRunners(newRunners);
        }

        setScore((prev) => prev + runsOnPlay);
        setBattingOrderIndex((battingOrderIndex + 1) % playerChart.length);

        // Clean up
        setPendingAction(null);
        closeDrawer();
    };

    const undoLast = () => {
        if (logs.length === 0) return;
        const lastLog = logs[logs.length - 1];
        if (!lastLog || !lastLog.$id) {
            console.error("Cannot undo: invalid last log", lastLog);
            return;
        }
        fetcher.submit(
            { _action: "undo-game-event", logId: lastLog.$id },
            { method: "post" },
        );
    };

    if (playerChart.length === 0) {
        return (
            <Card p="xl" withBorder radius="lg" ta="center">
                <Text fw={700} mb="xs">
                    Lineup Required
                </Text>
                <Text size="sm" c="dimmed">
                    You must create a lineup before scoring.
                </Text>
            </Card>
        );
    }

    return (
        <Stack gap="md">
            {realtimeError && (
                <Card withBorder p="xs" radius="md" bg="red.0" c="red.9">
                    <Text size="xs" fw={700}>
                        Realtime Error:
                    </Text>
                    <Text size="xs">{realtimeError}</Text>
                </Card>
            )}

            {fetcher.data?.error && (
                <Card withBorder p="xs" radius="md" bg="red.0" c="red.9">
                    <Text size="xs" fw={700}>
                        Action Error:
                    </Text>
                    <Text size="xs">{fetcher.data.error}</Text>
                </Card>
            )}

            <ScoreboardHeader
                score={score}
                opponentScore={opponentScore}
                inning={inning}
                halfInning={halfInning}
                outs={outs}
                teamName={team.name}
                opponentName={game.opponent}
                gameFinal={gameFinal}
                realtimeStatus={realtimeStatus}
            />

            <TabsWrapper value={activeTab} onChange={handleTabChange} mt={0}>
                {!gameFinal && <Tabs.Tab value="live">Live</Tabs.Tab>}
                <Tabs.Tab value="plays">Plays</Tabs.Tab>
                <Tabs.Tab value="boxscore">Box Score</Tabs.Tab>

                <Tabs.Panel value="live" pt="md">
                    <Stack gap="md">
                        {!gameFinal && (
                            <>
                                {isOurBatting ? (
                                    <>
                                        <CurrentBatterCard
                                            currentBatter={currentBatter}
                                            logs={logs}
                                        />
                                        <OnDeckCard
                                            onDeckBatter={onDeckBatter}
                                        />
                                    </>
                                ) : (
                                    <DefenseCard teamName={team.name} />
                                )}
                            </>
                        )}

                        <Group align="start" gap="xl" wrap="nowrap">
                            {/* Left Column: Visuals & Context */}
                            <Stack
                                gap="sm"
                                style={{ width: 180, flexShrink: 0 }}
                            >
                                <DiamondView runners={runners} />

                                {logs.length > 0 && isOurBatting && (
                                    <LastPlayCard
                                        lastLog={logs[logs.length - 1]}
                                        onUndo={isManager ? undoLast : null}
                                        isSubmitting={
                                            fetcher.state === "submitting"
                                        }
                                        playerChart={playerChart}
                                    />
                                )}
                            </Stack>

                            {/* Right Column: Actions */}
                            <Stack style={{ flex: 1 }}>
                                {isManager && !gameFinal && (
                                    <>
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
                                    </>
                                )}
                            </Stack>
                        </Group>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="plays" pt="md">
                    <Stack gap="md">
                        {!gameFinal && (
                            <>
                                {isOurBatting ? (
                                    <CurrentBatterCard
                                        currentBatter={currentBatter}
                                        logs={logs}
                                    />
                                ) : (
                                    <DefenseCard teamName={team.name} />
                                )}
                            </>
                        )}
                        <PlayHistoryList
                            logs={logs}
                            playerChart={playerChart}
                        />
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
            </TabsWrapper>

            <PlayActionDrawer
                opened={drawerOpened}
                onClose={closeDrawer}
                actionType={pendingAction}
                runners={runners}
                onSelect={(payload) => completeAction(pendingAction, payload)}
                playerChart={playerChart}
                currentBatter={currentBatter}
                outs={outs}
            />
        </Stack>
    );
}
