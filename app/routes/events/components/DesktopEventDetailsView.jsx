import { Box, Grid, Group, Tabs } from "@mantine/core";

import BackButton from "@/components/BackButton";
import TabsWrapper from "@/components/TabsWrapper";

import DesktopScorePanel from "./DesktopScorePanel";
import DesktopInfoPanel from "./DesktopInfoPanel";
import DesktopGamedayPanel from "./DesktopGamedayPanel";
import DesktopLineupPanel from "./DesktopLineupPanel";
import DesktopAttendancePanel from "./DesktopAttendancePanel";
import AwardsContainer from "./AwardsContainer";
import GameMenu from "./GameMenu";

export default function DesktopEventDetailsView({
    game,
    deferredData,
    season,
    team,
    user,
    weatherPromise,
    gameInProgress,
    gameIsPast,
    canScore,
    managerView,
    playerChart,
    result,
    openDeleteDrawer,
}) {
    const defaultTab = gameIsPast ? "awards" : "weather";

    return (
        <Grid gutter="md" mt="md" px="md" pb="xl">
            {/* Header row — Back | compact score (centred, not full-width) | GameMenu */}
            <Grid.Col span={12} mb="xl">
                <Group
                    justify="space-between"
                    align="center"
                    gap="md"
                    wrap="nowrap"
                >
                    <BackButton />

                    {/* Centring wrapper — score card has a fixed comfortable width */}
                    <Box
                        style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <DesktopScorePanel
                            game={game}
                            gameInProgress={gameInProgress}
                            gameIsPast={gameIsPast}
                            team={team}
                        />
                    </Box>

                    {managerView ? (
                        <GameMenu
                            game={game}
                            gameIsPast={gameIsPast}
                            openDeleteDrawer={openDeleteDrawer}
                            result={result}
                            season={season}
                            team={team}
                        />
                    ) : (
                        <Box style={{ width: 40 }} />
                    )}
                </Group>
            </Grid.Col>

            {/* LEFT COLUMN — Event Info + Gameday Hub */}
            <Grid.Col span={{ base: 12, lg: 5 }}>
                <Grid gutter="md">
                    <Grid.Col span={12}>
                        <DesktopInfoPanel
                            game={game}
                            deferredData={deferredData}
                            season={season}
                            team={team}
                            gameIsPast={gameIsPast}
                            user={user}
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <DesktopGamedayPanel
                            gameId={game.$id}
                            gameInProgress={gameInProgress}
                            gameIsPast={gameIsPast}
                            canScore={canScore}
                            weatherPromise={weatherPromise}
                            gameDate={game.gameDate}
                            showWeather={false}
                        />
                    </Grid.Col>
                </Grid>
            </Grid.Col>

            {/* RIGHT COLUMN — Tabbed panel */}
            <Grid.Col span={{ base: 12, lg: 7 }}>
                <TabsWrapper defaultValue={defaultTab} mt={0}>
                    {/* ── Tab labels ── */}
                    {!gameIsPast && (
                        <Tabs.Tab value="weather">Weather</Tabs.Tab>
                    )}
                    <Tabs.Tab value="attendance">Attendance</Tabs.Tab>
                    <Tabs.Tab value="lineups">Lineups</Tabs.Tab>
                    {gameIsPast && <Tabs.Tab value="awards">Awards</Tabs.Tab>}

                    {/* ── Tab panels ── */}
                    {!gameIsPast && (
                        <Tabs.Panel value="weather" pt="md">
                            {/* Weather-only view of the Gameday panel */}
                            <DesktopGamedayPanel
                                gameId={game.$id}
                                gameInProgress={gameInProgress}
                                gameIsPast={gameIsPast}
                                canScore={canScore}
                                weatherPromise={weatherPromise}
                                gameDate={game.gameDate}
                                weatherOnly
                            />
                        </Tabs.Panel>
                    )}
                    <Tabs.Panel value="attendance" pt="md">
                        <DesktopAttendancePanel
                            deferredData={deferredData}
                            game={game}
                            gameIsPast={gameIsPast}
                            managerView={managerView}
                            team={team}
                        />
                    </Tabs.Panel>
                    <Tabs.Panel value="lineups" pt="md">
                        <DesktopLineupPanel
                            game={game}
                            managerView={managerView}
                            playerChart={playerChart}
                        />
                    </Tabs.Panel>
                    {gameIsPast && (
                        <Tabs.Panel value="awards" pt="md">
                            <AwardsContainer
                                game={game}
                                team={team}
                                deferredData={deferredData}
                                user={user}
                            />
                        </Tabs.Panel>
                    )}
                </TabsWrapper>
            </Grid.Col>
        </Grid>
    );
}
