import {
    Box,
    Card,
    Grid,
    LoadingOverlay,
    Stack,
    Tabs,
    Text,
} from "@mantine/core";

import TabsWrapper from "@/components/TabsWrapper";

import { useGamedayController } from "../hooks/useGamedayController";

import BoxScore from "./BoxScore";
import CompactMatchupCard from "./CompactMatchupCard";
import ActionPad from "./ActionPad";
import PlayHistoryList from "./PlayHistoryList";
import DefenseCard from "./DefenseCard";
import LastPlayCard from "./LastPlayCard";
import FieldingControls from "./FieldingControls";
import PlayActionDrawer from "./PlayActionDrawer";
import ContactSprayChart from "@/components/ContactSprayChart";

export default function DesktopGamedayContainer({
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
        isDesktop: true,
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
            <Box pos="relative">
                <LoadingOverlay
                    visible={isSyncing}
                    overlayProps={{ radius: "lg", blur: 1, opacity: 0.1 }}
                    loaderProps={{ color: "blue", type: "dots" }}
                    zIndex={100}
                />

                <Grid gutter="xl" mt="md" align="flex-start">
                    {/* COLUMN 1: Matchup */}
                    <Grid.Col span={{ base: 12, lg: 4 }}>
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
                                onDeckBatter={onDeckBatter}
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
                    <Grid.Col span={{ base: 12, lg: 4 }}>
                        <Stack gap="md">
                            {!gameFinal &&
                                (isOurBatting ? (
                                    isScorekeeper && (
                                        <ActionPad
                                            onAction={initiateAction}
                                            runners={runners}
                                            outs={outs}
                                        />
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
                    <Grid.Col span={{ base: 12, lg: 4 }}>
                        <TabsWrapper
                            value={activeTab}
                            onChange={(val) => handleTabChange(val)}
                            mt={0}
                            size="sm"
                        >
                            <Tabs.Tab value="plays">Plays</Tabs.Tab>
                            <Tabs.Tab value="boxscore">Box Score</Tabs.Tab>
                            <Tabs.Tab value="spray">Spray Chart</Tabs.Tab>

                            <Tabs.Panel value="plays" pt="md">
                                <Stack gap="md">
                                    <Card withBorder radius="md" p="xs">
                                        <PlayHistoryList
                                            logs={logs}
                                            playerChart={playerChart}
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
                        </TabsWrapper>
                    </Grid.Col>
                </Grid>
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
