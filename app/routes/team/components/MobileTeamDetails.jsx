import { Group, Tabs } from "@mantine/core";
import {
    IconCalendarMonth,
    IconUsersGroup,
    IconBallBaseball,
} from "@tabler/icons-react";

import TabsWrapper from "@/components/TabsWrapper";
import PlayerList from "./PlayerList";
import SeasonList from "./SeasonList";
import GamesList from "./GamesList";

export default function MobileTeamDetails({
    team,
    players,
    managerIds,
    managerView,
    user,
    teamLogs,
}) {
    const { primaryColor, seasons } = team;

    return (
        <TabsWrapper color={primaryColor} defaultValue="seasons">
            <Tabs.Tab value="roster">
                <Group gap="xs" align="center" justify="center">
                    <IconUsersGroup size={16} />
                    Roster
                </Group>
            </Tabs.Tab>
            <Tabs.Tab value="seasons">
                <Group gap="xs" align="center" justify="center">
                    <IconCalendarMonth size={16} />
                    Seasons
                </Group>
            </Tabs.Tab>
            <Tabs.Tab value="games" disabled={seasons?.length === 0}>
                <Group gap="xs" align="center" justify="center">
                    <IconBallBaseball size={16} />
                    Games
                </Group>
            </Tabs.Tab>

            <Tabs.Panel value="roster">
                <PlayerList
                    players={players}
                    managerIds={managerIds}
                    managerView={managerView}
                    user={user}
                    teamLogs={teamLogs}
                />
            </Tabs.Panel>

            <Tabs.Panel value="seasons">
                <SeasonList
                    seasons={seasons}
                    teamId={team.$id}
                    managerView={managerView}
                    primaryColor={primaryColor}
                />
            </Tabs.Panel>

            <Tabs.Panel value="games">
                <GamesList
                    games={seasons?.[0]?.games}
                    seasons={seasons}
                    teamId={team.$id}
                    managerView={managerView}
                    primaryColor={primaryColor}
                />
            </Tabs.Panel>
        </TabsWrapper>
    );
}
