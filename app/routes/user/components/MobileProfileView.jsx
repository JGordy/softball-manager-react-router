import { Alert, Group, Tabs } from "@mantine/core";
import {
    IconAward,
    IconClipboardData,
    IconLock,
    IconUserSquareRounded,
} from "@tabler/icons-react";

import { canViewStats } from "@/utils/users";

import TabsWrapper from "@/components/TabsWrapper";
import PersonalDetails from "@/components/PersonalDetails";
import PlayerDetails from "@/components/PlayerDetails";

import PlayerStats from "./PlayerStats";
import PlayerAwards from "./PlayerAwards";

export default function MobileProfileView({
    tab,
    handleTabChange,
    player,
    loggedInUser,
    awardsPromise,
    statsPromise,
}) {
    const activeTab = tab === "attendance" ? "player" : tab;

    return (
        <TabsWrapper value={activeTab} onChange={handleTabChange}>
            <Tabs.Tab value="player">
                <Group gap="xs" align="center" justify="center">
                    <IconUserSquareRounded size={16} />
                    Details
                </Group>
            </Tabs.Tab>
            <Tabs.Tab value="stats">
                <Group gap="xs" align="center" justify="center">
                    <IconClipboardData size={16} />
                    Stats
                </Group>
            </Tabs.Tab>
            <Tabs.Tab value="awards">
                <Group gap="xs" align="center" justify="center">
                    <IconAward size={16} />
                    Awards
                </Group>
            </Tabs.Tab>

            <Tabs.Panel value="player">
                <PersonalDetails player={player} user={loggedInUser} />
                <PlayerDetails user={loggedInUser} player={player} />
            </Tabs.Panel>

            <Tabs.Panel value="stats">
                {canViewStats(player, loggedInUser) ? (
                    <PlayerStats
                        statsPromise={statsPromise}
                        isDesktop={false}
                    />
                ) : (
                    <Alert
                        icon={<IconLock size={16} />}
                        title="Stats are Private"
                        color="gray"
                        radius="lg"
                        mt="md"
                    >
                        {player.firstName} has set their stats to private. Only
                        teammates and coaches can view their performance data.
                    </Alert>
                )}
            </Tabs.Panel>

            <Tabs.Panel value="awards">
                <PlayerAwards
                    awardsPromise={awardsPromise}
                    statsPromise={statsPromise}
                />
            </Tabs.Panel>
        </TabsWrapper>
    );
}
