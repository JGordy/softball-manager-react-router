import {
    Box,
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

export default function MobileGamedayContainer({
    game,
    playerChart: initialPlayerChart,
    team,
    initialLogs = [],
    gameFinal = false,
    isScorekeeper = false,
    players = [],
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
    } = useGamedayController({
        game,
        playerChart: initialPlayerChart,
        team,
        initialLogs,
        gameFinal,
        isScorekeeper,
        players,
    });

    const [subModalOpened, { open: openSubModal, close: closeSubModal }] =
        useDisclosure(false);

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
            {/* Page header — rendered here so menu has access to openSubModal */}
            <Group justify="space-between" align="center">
                <BackButton to={`/events/${game.$id}`} />
                <Title order={3}>Scoring & Stats</Title>
                {isScorekeeper ? (
                    <GamedayMenu
                        gameFinal={gameFinal}
                        score={score}
                        opponentScore={opponentScore}
                        onSubBatter={isOurBatting ? openSubModal : undefined}
                    />
                ) : (
                    <div style={{ minWidth: 40 }} />
                )}
            </Group>

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
                runners={runners}
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

                            {isScorekeeper && !gameFinal && (
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
                                <Box mt="auto" pt="md">
                                    <LastPlayCard
                                        lastLog={logs[logs.length - 1]}
                                        onUndo={isScorekeeper ? undoLast : null}
                                        isSubmitting={isSubmitting}
                                        playerChart={playerChart}
                                    />
                                </Box>
                            )}
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
        </Stack>
    );
}
