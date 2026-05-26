import { useState, useEffect, useMemo, useCallback } from "react";
import { useGamedayTabs } from "./useGamedayTabs";
import { useGamedayActions } from "./useGamedayActions";
import { useGameState } from "./useGameState";
import { useGameUpdates } from "@/hooks/useGameUpdates";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { parsePlayerChart } from "../utils/gamedayUtils";

export function useGamedayController({
    game,
    playerChart: initialPlayerChart,
    team,
    initialLogs = [],
    gameFinal = false,
    isScorekeeper = false,
    isDesktop = false,
    players = [],
}) {
    const [logs, setLogs] = useState(initialLogs);
    // Hold playerChart in local state so sub updates reflect immediately
    const [lineup, setLineup] = useState(initialPlayerChart);
    // Hold game details in local state to allow real-time background recap and final state updates
    const [gameData, setGameData] = useState(game);

    const parsedOpponentLineup = useMemo(() => {
        const defaultOpponentLineup = Array.from({ length: 10 }).map(
            (_, i) => ({
                $id: `OPP_BAT_${i + 1}`,
                firstName: "Batter",
                lastName: `${i + 1}`,
                substitutions: [],
            }),
        );

        return (
            parsePlayerChart(gameData.opponentLineup) || defaultOpponentLineup
        );
    }, [gameData.opponentLineup]);

    const [opponentChart, setOpponentChart] = useState(parsedOpponentLineup);
    const [opponentScoringMode, setOpponentScoringMode] = useState(
        gameData.opponentScoringMode || "Detailed",
    );

    // Real-time updates for the game document itself (specifically recap and finalized status)
    useGameRealtime(game.$id, {
        onGameUpdate: (updatedGame) => {
            setGameData(updatedGame);
        },
        enabled: true,
    });

    // Enrich playerChart with live data (like avatarUrl) from the players (user documents) array
    const playerChart = useMemo(() => {
        const playerMap = new Map(players.map((p) => [p.$id, p]));
        return lineup.map((slot) => {
            const playerDoc = playerMap.get(slot.$id);
            const enrichedSlot = {
                ...slot,
                avatarUrl: playerDoc?.avatarUrl || slot.avatarUrl,
            };

            if (slot.substitutions) {
                enrichedSlot.substitutions = slot.substitutions.map((sub) => {
                    const subDoc = playerMap.get(sub.playerId);
                    return {
                        ...sub,
                        avatarUrl: subDoc?.avatarUrl || sub.avatarUrl,
                    };
                });
            }
            return enrichedSlot;
        });
    }, [lineup, players]);

    const setPlayerChart = setLineup;

    // Real-time updates for game logs
    const { status: realtimeStatus } = useGameUpdates(gameData.$id, {
        onNewLog: (newLog) => {
            setLogs((prev) => {
                const logExists = prev.some((log) => log.$id === newLog.$id);
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
            setLogs((prev) => prev.filter((log) => log.$id !== deletedLogId));
        },
        gameDate: gameData.gameDate,
        gameFinal: !!gameData.gameFinal,
    });

    // Sub-hook: Tab navigation & URL Sync
    const hasRecapTab =
        !!gameData.gameFinal && (!!gameData.recap || logs.length > 0);
    const { activeTab, handleTabChange, setActiveTab } = useGamedayTabs({
        gameFinal: !!gameData.gameFinal,
        isDesktop,
        hasRecapTab,
    });

    // Primary Game Logic State
    const gameState = useGameState({
        logs,
        game: gameData,
        playerChart,
        opponentChart,
    });
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
        opponentOrderIndex,
        setOpponentOrderIndex,
    } = gameState;

    const isOurBatting = gameData.isHomeGame
        ? halfInning === "bottom"
        : halfInning === "top";

    const getOpponentBatter = useCallback(
        (index) => {
            return (
                opponentChart[index] || {
                    $id: `OPP_BAT_${index + 1}`,
                    firstName: `Batter ${index + 1}`,
                    lastName: "",
                    jerseyNumber: "",
                }
            );
        },
        [opponentChart],
    );

    const currentBatter = isOurBatting
        ? playerChart[battingOrderIndex]
        : getOpponentBatter(opponentOrderIndex);

    // Sub-hook: Scoring Actions
    const {
        pendingAction,
        drawerOpened,
        openDrawer,
        closeDrawer,
        advanceHalfInning,
        handleOpponentRun,
        handleOpponentOut,
        handleSelectOpponentBatter,
        initiateAction,
        completeAction,
        handleSubCurrentBatter: handleSubAction,
        undoLast,
        updateAction,
        isSubmitting,
        fetcher,
    } = useGamedayActions({
        playerChart,
        team,
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
        logs,
        isScorekeeper,
        game: gameData,
        currentBatter,
        isOurBatting,
        opponentOrderIndex,
        setOpponentOrderIndex,
        opponentChart,
    });

    // Derive the list of players eligible to substitute:
    // In the playerChart, but not already occupying any slot (original or sub)
    const occupiedIds = useMemo(() => {
        const ids = new Set();
        playerChart.forEach((slot) => {
            ids.add(slot.$id);
            slot.substitutions?.forEach((s) => ids.add(s.playerId));
        });
        return ids;
    }, [playerChart]);

    const eligibleSubstitutes = useMemo(() => {
        return players.filter((p) => !occupiedIds.has(p.$id));
    }, [players, occupiedIds]);

    /**
     * Bound sub handler — passes the current chart and a state updater.
     */
    const handleSubCurrentBatter = useCallback(
        (incomingPlayer) => {
            handleSubAction(
                incomingPlayer,
                battingOrderIndex,
                playerChart,
                setPlayerChart,
            );
        },
        [handleSubAction, battingOrderIndex, playerChart],
    );

    const handleUndoLast = useCallback(() => {
        if (!isScorekeeper || logs.length === 0) return;
        const lastLog = logs[logs.length - 1];
        if (!lastLog || !lastLog.$id) return;

        if (lastLog.eventType === "SUB") {
            const revertedChart = playerChart.map((slot) => {
                if (!slot.substitutions || slot.substitutions.length === 0)
                    return slot;
                const lastSub =
                    slot.substitutions[slot.substitutions.length - 1];
                if (lastSub.playerId === lastLog.playerId) {
                    return {
                        ...slot,
                        substitutions: slot.substitutions.slice(0, -1),
                    };
                }
                return slot;
            });
            setPlayerChart(revertedChart);
            undoLast(revertedChart);
        } else {
            undoLast();
        }
    }, [isScorekeeper, logs, playerChart, setPlayerChart, undoLast]);

    const saveOpponentChart = useCallback(
        (updatedChart) => {
            setOpponentChart(updatedChart);
            fetcher.submit(
                {
                    _action: "update-opponent-settings",
                    opponentLineup: JSON.stringify(updatedChart),
                },
                { method: "post" },
            );
        },
        [fetcher, setOpponentChart],
    );

    const batters = useMemo(() => {
        const batterMap = new Map();

        playerChart.forEach((slot) => {
            // Add starter
            const starterName =
                `${slot.firstName || ""} ${slot.lastName || ""}`.trim() ||
                "Unknown Player";
            batterMap.set(slot.$id, {
                value: slot.$id,
                label: starterName,
            });

            // Add all unique substitutes for this slot
            slot.substitutions?.forEach((sub) => {
                if (!batterMap.has(sub.playerId)) {
                    const subName =
                        `${sub.firstName || ""} ${sub.lastName || ""}`.trim() ||
                        "Unknown Player";
                    batterMap.set(sub.playerId, {
                        value: sub.playerId,
                        label: `${subName} (Sub)`,
                    });
                }
            });
        });

        return Array.from(batterMap.values()).sort((a, b) =>
            a.label.localeCompare(b.label),
        );
    }, [playerChart]);

    // Update logs when fetcher returns a new log successfully
    useEffect(() => {
        if (
            fetcher.data?.success &&
            fetcher.data?.log &&
            fetcher.state === "idle"
        ) {
            setLogs((prev) => {
                const logExists = prev.some(
                    (log) => log.$id === fetcher.data.log.$id,
                );
                if (logExists) return prev;
                return [...prev, fetcher.data.log];
            });
        }
    }, [fetcher.data, fetcher.state]);

    // Sync initial game data when the prop changes (e.g. from loader revalidation)
    useEffect(() => {
        setGameData(game);
    }, [game]);

    // Sync initialLogs when they change
    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    // Sync initialPlayerChart when it changes (e.g. from loader revalidation)
    useEffect(() => {
        setPlayerChart(initialPlayerChart);
    }, [initialPlayerChart]);

    // Sync opponentChart when gameData.opponentLineup changes
    useEffect(() => {
        setOpponentChart(parsedOpponentLineup);
    }, [parsedOpponentLineup]);

    const isSyncing = fetcher.state !== "idle" || realtimeStatus === "syncing";

    const upcomingBatters = [];
    if (isOurBatting) {
        if (playerChart.length > 1) {
            const numBattersToFetch = Math.min(3, playerChart.length - 1);
            for (let i = 1; i <= numBattersToFetch; i++) {
                upcomingBatters.push(
                    playerChart[(battingOrderIndex + i) % playerChart.length],
                );
            }
        }
    } else {
        const chartLength = gameData.opponentLineupLocked
            ? Math.max(opponentChart.length, 1)
            : opponentOrderIndex + 4;
        for (let i = 1; i <= 3; i++) {
            let nextIndex = opponentOrderIndex + i;
            if (gameData.opponentLineupLocked) {
                nextIndex = nextIndex % chartLength;
            }
            upcomingBatters.push(getOpponentBatter(nextIndex));
        }
    }

    const dueUpBatters = [currentBatter, ...upcomingBatters]
        .slice(0, 3)
        .filter(Boolean);

    return {
        game: gameData,
        logs,
        setLogs,
        realtimeStatus,
        activeTab,
        setActiveTab,
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
        isScorekeeper,
        pendingAction,
        drawerOpened,
        openDrawer,
        closeDrawer,
        advanceHalfInning,
        handleOpponentRun,
        handleOpponentOut,
        handleSelectOpponentBatter,
        initiateAction,
        completeAction,
        handleSubCurrentBatter,
        eligibleSubstitutes,
        playerChart,
        opponentChart,
        setOpponentChart,
        saveOpponentChart,
        opponentOrderIndex,
        opponentScoringMode,
        setOpponentScoringMode,
        undoLast: handleUndoLast,
        updateAction,
    };
}
