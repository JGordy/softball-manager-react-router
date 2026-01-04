import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

import { Card, Group, Stack, Text, Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import TabsWrapper from "@/components/TabsWrapper";

import { useGameState } from "./useGameState";
import { UI_BATTED_OUTS, UI_WALKS } from "./scoringConstants";

import ScoreboardHeader from "./ScoreboardHeader";
import DiamondView from "./DiamondView";
import ActionPad from "./ActionPad";
import PlayHistoryList from "./PlayHistoryList";
import PositionPickerDrawer from "./PositionPickerDrawer";
import CurrentBatterCard from "./CurrentBatterCard";
import DefenseCard from "./DefenseCard";
import LastPlayCard from "./LastPlayCard";
import FieldingControls from "./FieldingControls";

function getEventDescription(actionType, batterName, position) {
    if (actionType === "1B") return `${batterName} singles to ${position}`;
    if (actionType === "2B") return `${batterName} doubles to ${position}`;
    if (actionType === "3B") return `${batterName} triples to ${position}`;
    if (actionType === "HR")
        return `${batterName} hits a home run to ${position}`;
    if (actionType === "Ground Out")
        return `${batterName} grounds out to ${position}`;
    if (actionType === "Fly Out")
        return `${batterName} flies out to ${position}`;
    if (actionType === "Line Out")
        return `${batterName} lines out to ${position}`;
    if (actionType === "Pop Out")
        return `${batterName} pops out to ${position}`;
    if (actionType === "E")
        return `${batterName} reaches on an error by ${position}`;
    if (actionType === "BB") return `${batterName} walks`;
    if (actionType === "K") return `${batterName} strikes out`;

    return `${batterName}: ${actionType}${position ? ` (${position})` : ""}`;
}

/**
 * Handles walk events with correct forced runner advancement logic.
 * A walk forces all runners to advance only if there's a force play.
 */
function handleWalk(runners) {
    const { first: r1, second: r2, third: r3 } = runners;
    let runsOnPlay = 0;

    // Runner on third scores only if all bases were occupied (forced home)
    if (r1 && r2 && r3) runsOnPlay++;

    const newRunners = {
        // Batter always goes to first
        first: true,
        // Runner on first is forced to second
        // Runner on second stays on second if there's no runner on first
        second: r1 || (r2 && !r1),
        // Runner on second is forced to third only if both first and second were occupied
        // Runner on third stays unless unless the bases are loaded
        third: (r1 && r2) || (r3 && (!r1 || !r2)),
    };

    return { newRunners, runsOnPlay, outsRecorded: 0 };
}

/**
 * Handles events where the drawer provides manual runner results.
 * Used for hits, errors, and batted outs with runners.
 */
function handleRunnerResults(runnerResults, runners) {
    let newRunners = { first: false, second: false, third: false };
    let runsOnPlay = 0;
    let outsRecorded = 0;

    const processRunner = (result, originBase) => {
        if (!result) return;
        if (result === "score") runsOnPlay++;
        else if (result === "out") outsRecorded++;
        else if (result === "stay" && originBase) newRunners[originBase] = true;
        else if (["first", "second", "third"].includes(result))
            newRunners[result] = true;
    };

    // Process Batter
    processRunner(runnerResults.batter, "first");

    // Process Existing Runners
    ["first", "second", "third"].forEach((base) => {
        if (runners[base]) {
            processRunner(runnerResults[base], base);
        }
    });

    return { newRunners, runsOnPlay, outsRecorded };
}

/**
 * Handles automatic outs (strikeouts and batted outs without runners).
 * Runners stay in place.
 */
function handleAutomaticOut(runners) {
    return {
        newRunners: { ...runners },
        runsOnPlay: 0,
        outsRecorded: 1,
    };
}

export default function ScoringContainer({
    game,
    playerChart,
    team,
    initialLogs = [],
}) {
    const fetcher = useFetcher();
    const [logs, setLogs] = useState(initialLogs);

    // Update logs when fetcher returns a new log or when undo succeeds
    useEffect(() => {
        if (fetcher.data?.success && fetcher.data?.log) {
            // New log created - append it
            setLogs((prev) => [...prev, fetcher.data.log]);
        } else if (fetcher.data?.success && fetcher.state === "idle") {
            // Undo succeeded - refetch is needed, use initial logs from loader
            // This will be handled by revalidation
        }
    }, [fetcher.data, fetcher.state]);

    // Sync with initialLogs when they change (from loader revalidation)
    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

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

    const advanceHalfInning = () => {
        setOuts(0);
        setRunners({ first: false, second: false, third: false });
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

        const batter = playerChart[battingOrderIndex];
        const batterName = `${batter.firstName} ${batter.lastName}`;
        const description = getEventDescription(
            actionType,
            batterName,
            position,
        );

        let result;

        // Route to appropriate handler based on event type
        if (UI_WALKS.includes(actionType)) {
            result = handleWalk(runners);
        } else if (runnerResults) {
            // Manual overrides from Drawer (Used for Hits, Errors, and Batted Outs)
            result = handleRunnerResults(runnerResults, runners);
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
                inning,
                halfInning,
                playerId: batter.$id,
                eventType: actionType,
                rbi: runsOnPlay,
                outsOnPlay: outsRecorded,
                description,
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
        fetcher.submit(
            { _action: "undo-game-event", logId: lastLog.$id },
            { method: "post" },
        );
    };

    if (!playerChart || playerChart.length === 0) {
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
            <ScoreboardHeader
                score={score}
                opponentScore={opponentScore}
                inning={inning}
                halfInning={halfInning}
                outs={outs}
                teamName={team.name}
                opponentName={game.opponent}
            />

            <TabsWrapper defaultValue="live" mt={0}>
                <Tabs.Tab value="live">Live</Tabs.Tab>
                <Tabs.Tab value="history">History</Tabs.Tab>

                <Tabs.Panel value="live" pt="md">
                    <Stack gap="md">
                        {isOurBatting ? (
                            <CurrentBatterCard
                                currentBatter={currentBatter}
                                logs={logs}
                            />
                        ) : (
                            <DefenseCard teamName={team.name} />
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
                                        onUndo={undoLast}
                                        isSubmitting={
                                            fetcher.state === "submitting"
                                        }
                                    />
                                )}
                            </Stack>

                            {/* Right Column: Actions */}
                            <Stack style={{ flex: 1 }}>
                                {isOurBatting ? (
                                    <ActionPad onAction={initiateAction} />
                                ) : (
                                    <FieldingControls
                                        onOut={handleOpponentOut}
                                        onRun={handleOpponentRun}
                                        onSkip={advanceHalfInning}
                                    />
                                )}
                            </Stack>
                        </Group>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="history" pt="md">
                    <PlayHistoryList logs={logs} />
                </Tabs.Panel>
            </TabsWrapper>

            <PositionPickerDrawer
                opened={drawerOpened}
                onClose={closeDrawer}
                actionType={pendingAction}
                runners={runners}
                onSelect={(payload) => completeAction(pendingAction, payload)}
            />
        </Stack>
    );
}
