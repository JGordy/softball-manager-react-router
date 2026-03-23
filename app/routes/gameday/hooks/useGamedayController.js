import { useState, useEffect, useMemo } from "react";
import { useGamedayTabs } from "./useGamedayTabs";
import { useGamedayActions } from "./useGamedayActions";
import { useGameState } from "./useGameState";
import { useGameUpdates } from "@/hooks/useGameUpdates";

export function useGamedayController({
    game,
    playerChart,
    team,
    initialLogs = [],
    gameFinal = false,
    isScorekeeper = false,
    isDesktop = false,
}) {
    const [logs, setLogs] = useState(initialLogs);

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
        undoLast,
    };
}
