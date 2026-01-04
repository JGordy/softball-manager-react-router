import { useState } from "react";
import { useFetcher } from "react-router";

import { Card, Group, Stack, Text, Tabs } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import TabsWrapper from "@/components/TabsWrapper";

import { useGameState } from "./useGameState";
import { BATTED_OUTS, WALKS } from "./scoringConstants";

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

export default function ScoringContainer({
    game,
    playerChart,
    team,
    initialLogs = [],
}) {
    const fetcher = useFetcher();

    // We keep some local state for animations and immediate feedback,
    // but the source of truth for logs will come from the loader/fetcher.
    const logs = fetcher.data?.logs || initialLogs;

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

    // Calculate current batter's game stats

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
        if (["K", ...WALKS].includes(actionType)) {
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

        let newRunners = { first: false, second: false, third: false };
        let outsRecorded = 0;
        let runsOnPlay = 0;

        // 1. Handle the Batter
        if (WALKS.includes(actionType)) {
            // Forced logic for walks
            if (runners.first && runners.second && runners.third) runsOnPlay++;
            newRunners = {
                first: true,
                second: runners.first || runners.second,
                third: (runners.first && runners.second) || runners.third,
            };
        } else if (runnerResults) {
            // Manual overrides from Drawer (Used for Hits, Errors, and Batted Outs)
            const processRunner = (result, originBase) => {
                if (!result) return;
                if (result === "score") runsOnPlay++;
                else if (result === "out") outsRecorded++;
                else if (result === "stay" && originBase)
                    newRunners[originBase] = true;
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
        } else if (actionType === "K" || BATTED_OUTS.includes(actionType)) {
            outsRecorded++;
            // Default: runners stay on automatic outs with no drawer (like K)
            newRunners = { ...runners };
        } else {
            // Fallback/Deterministic logic (for things like BB/HBP if runnerResults missing)
            if (actionType === "1B" || actionType === "E") {
                if (runners.third) runsOnPlay++;
                newRunners = {
                    first: true,
                    second: runners.first,
                    third: runners.second,
                };
            } else if (actionType === "2B") {
                if (runners.third) runsOnPlay++;
                if (runners.second) runsOnPlay++;
                newRunners = {
                    first: false,
                    second: true,
                    third: runners.first,
                };
            } else if (actionType === "HR") {
                runsOnPlay =
                    1 +
                    (runners.first ? 1 : 0) +
                    (runners.second ? 1 : 0) +
                    (runners.third ? 1 : 0);
                newRunners = { first: false, second: false, third: false };
            }
        }

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
