import { Alert, Tabs } from "@mantine/core";

import { IconLock } from "@tabler/icons-react";

import { canViewStats } from "@/utils/users";

import TabsWrapper from "@/components/TabsWrapper";
import PersonalDetails from "@/components/PersonalDetails";
import PlayerDetails from "@/components/PlayerDetails";

import PlayerStats from "./PlayerStats";
import PlayerAwards from "./PlayerAwards";
import PlayerAchievements from "./PlayerAchievements";

export default function MobileProfileView({
    tab,
    handleTabChange,
    player,
    loggedInUser,
    awardsPromise,
    statsPromise,
    achievementsPromise,
}) {
    const activeTab = tab === "attendance" ? "player" : tab;

    return (
        <TabsWrapper value={activeTab} onChange={handleTabChange}>
            <Tabs.Tab value="player">
                Details
            </Tabs.Tab>
            <Tabs.Tab value="stats">
                Stats
            </Tabs.Tab>
            <Tabs.Tab value="awards">
                Awards
            </Tabs.Tab>
            <Tabs.Tab value="achievements">
                Achievements
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
                        coaches and managers can view their performance data.
                    </Alert>
                )}
            </Tabs.Panel>

            <Tabs.Panel value="awards">
                <PlayerAwards
                    awardsPromise={awardsPromise}
                    statsPromise={statsPromise}
                />
            </Tabs.Panel>

            <Tabs.Panel value="achievements" mt="md">
                <PlayerAchievements achievementsPromise={achievementsPromise} />
            </Tabs.Panel>
        </TabsWrapper>
    );
}
