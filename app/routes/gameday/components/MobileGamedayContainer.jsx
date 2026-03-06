import {
    Box,
    Card,
    Group,
    LoadingOverlay,
    Stack,
    Tabs,
    Text,
} from "@mantine/core";

import TabsWrapper from "@/components/TabsWrapper";

import { useGamedayController } from "../hooks/useGamedayController";

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
import ContactSprayChart from "@/components/ContactSprayChart";

export default function MobileGamedayContainer({
    game,
    playerChart,
    team,
    initialLogs = [],
    gameFinal = false,
    isScorekeeper = false,
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
        onDeckBatter,
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
        undoLast,
    } = useGamedayController({
        game,
        playerChart,
        team,
        initialLogs,
        gameFinal,
        isScorekeeper,
    });

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
                isOurBatting={isOurBatting}
            />

            <Box pos="relative">
                <LoadingOverlay
                    visible={isSyncing}
                    overlayProps={{ radius: "lg", blur: 1, opacity: 0.1 }}
                    loaderProps={{ color: "blue", type: "dots" }}
                    zIndex={100}
                />
                <TabsWrapper
                    value={activeTab}
                    onChange={handleTabChange}
                    mt={0}
                >
                    {!gameFinal && <Tabs.Tab value="live">Live</Tabs.Tab>}
                    <Tabs.Tab value="plays">Plays</Tabs.Tab>
                    <Tabs.Tab value="boxscore">Box Score</Tabs.Tab>
                    <Tabs.Tab value="spray">Spray Chart</Tabs.Tab>

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
                                        <DefenseCard
                                            teamName={team.name}
                                            dueUpBatters={dueUpBatters}
                                        />
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
                                            onUndo={
                                                isScorekeeper ? undoLast : null
                                            }
                                            isSubmitting={isSubmitting}
                                            playerChart={playerChart}
                                        />
                                    )}
                                </Stack>

                                {/* Right Column: Actions */}
                                <Stack style={{ flex: 1 }}>
                                    {isScorekeeper && !gameFinal && (
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

                    <Tabs.Panel value="spray" pt="md">
                        <ContactSprayChart
                            hits={logs}
                            showBattingSide={false}
                            batters={batters}
                        />
                    </Tabs.Panel>
                </TabsWrapper>
            </Box>

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
