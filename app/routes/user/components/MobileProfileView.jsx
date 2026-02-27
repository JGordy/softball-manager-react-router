import { Group, Tabs } from "@mantine/core";
import {
    IconAward,
    IconClipboardData,
    IconUserSquareRounded,
} from "@tabler/icons-react";

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
}) {
    return (
        <TabsWrapper value={tab} onChange={handleTabChange}>
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
                <PlayerStats playerId={player.$id} />
            </Tabs.Panel>

            <Tabs.Panel value="awards">
                <PlayerAwards
                    awardsPromise={awardsPromise}
                    playerId={player.$id}
                />
            </Tabs.Panel>
        </TabsWrapper>
    );
}
