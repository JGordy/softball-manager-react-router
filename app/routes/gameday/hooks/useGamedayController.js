import { useState, useEffect, useMemo, useCallback } from "react";
import { useGamedayTabs } from "./useGamedayTabs";
import { useGamedayActions } from "./useGamedayActions";
import { useGameState } from "./useGameState";
import { useGameUpdates } from "@/hooks/useGameUpdates";

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
    const [playerChart, setPlayerChart] = useState(initialPlayerChart);

    // Real-time updates for game logs
    const { status: realtimeStatus } = useGameUpdates(game.$id, {
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
        gameDate: game.gameDate,
        gameFinal,
    });

    // Sub-hook: Tab navigation & URL Sync
    const { activeTab, handleTabChange, setActiveTab } = useGamedayTabs({
        gameFinal,
        isDesktop,
    });

    // Primary Game Logic State
    const gameState = useGameState({ logs, game, playerChart });
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
    } = gameState;

    // Sub-hook: Scoring Actions
    const {
        pendingAction,
        drawerOpened,
        openDrawer,
        closeDrawer,
        advanceHalfInning,
        handleOpponentRun,
        handleOpponentOut,
        initiateAction,
        completeAction,
        handleSubCurrentBatter: handleSubAction,
        undoLast,
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

    const batters = useMemo(() => {
        return playerChart
            .map((p) => {
                const name =
                    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
                    "Unknown Player";
                return {
                    value: p.$id,
                    label: name,
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));
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

    // Sync initialLogs when they change
    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    // Sync initialPlayerChart when it changes (e.g. from loader revalidation)
    useEffect(() => {
        setPlayerChart(initialPlayerChart);
    }, [initialPlayerChart]);

    const isSyncing = fetcher.state !== "idle" || realtimeStatus === "syncing";

    const isOurBatting = game.isHomeGame
        ? halfInning === "bottom"
        : halfInning === "top";

    const currentBatter = playerChart[battingOrderIndex];

    const upcomingBatters = [];
    if (playerChart.length > 1) {
        const numBattersToFetch = Math.min(3, playerChart.length - 1);
        for (let i = 1; i <= numBattersToFetch; i++) {
            upcomingBatters.push(
                playerChart[(battingOrderIndex + i) % playerChart.length],
            );
        }
    }

    const dueUpBatters = [currentBatter, ...upcomingBatters]
        .slice(0, 3)
        .filter(Boolean);

    return {
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
        initiateAction,
        completeAction,
        handleSubCurrentBatter,
        eligibleSubstitutes,
        playerChart,
        undoLast: handleUndoLast,
    };
}
