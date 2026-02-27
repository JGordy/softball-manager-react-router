import { Box, Grid, Card, Tabs } from "@mantine/core";
import {
    IconAward,
    IconCalendarCheck,
    IconClipboardData,
} from "@tabler/icons-react";

import TabsWrapper from "@/components/TabsWrapper";

import PersonalDetails from "@/components/PersonalDetails";
import PlayerDetails from "@/components/PlayerDetails";

import PlayerStats from "./PlayerStats";
import PlayerAwards from "./PlayerAwards";
import PlayerAttendance from "./PlayerAttendance";

export default function DesktopProfileView({
    tab,
    handleTabChange,
    player,
    loggedInUser,
    awardsPromise,
    attendancePromise,
}) {
    return (
        <Grid gutter="xl" mt="xl">
            {/* Left Column: Details */}
            <Grid.Col span={{ base: 12, md: 5 }}>
                <Box mx="auto">
                    <PersonalDetails player={player} user={loggedInUser} />
                    <PlayerDetails user={loggedInUser} player={player} />
                </Box>
            </Grid.Col>

            {/* Right Column: Stats & Awards */}
            <Grid.Col span={{ base: 12, md: 7 }}>
                <TabsWrapper
                    defaultValue="stats"
                    value={tab === "player" ? "stats" : tab}
                    onChange={handleTabChange}
                    mt={0}
                >
                    <Tabs.Tab
                        value="stats"
                        leftSection={<IconClipboardData size={16} />}
                    >
                        Stats
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="awards"
                        leftSection={<IconAward size={16} />}
                    >
                        Awards
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="attendance"
                        leftSection={<IconCalendarCheck size={16} />}
                    >
                        Attendance
                    </Tabs.Tab>

                    <Tabs.Panel value="stats" pt="xl">
                        <PlayerStats playerId={player.$id} />
                    </Tabs.Panel>

                    <Tabs.Panel value="awards" pt="xl">
                        <Card shadow="sm" padding="lg" radius="lg" withBorder>
                            <PlayerAwards
                                awardsPromise={awardsPromise}
                                playerId={player.$id}
                            />
                        </Card>
                    </Tabs.Panel>

                    <Tabs.Panel value="attendance" pt="xl">
                        <PlayerAttendance
                            attendancePromise={attendancePromise}
                        />
                    </Tabs.Panel>
                </TabsWrapper>
            </Grid.Col>
        </Grid>
    );
}
