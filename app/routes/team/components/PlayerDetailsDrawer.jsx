import { Tabs, Group } from "@mantine/core";
import {
    IconBallBaseball,
    IconUserSquareRounded,
    IconMap2,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import TabsWrapper from "@/components/TabsWrapper";
import PlayerDetails from "@/components/PlayerDetails";
import PersonalDetails from "@/components/PersonalDetails";
import ContactSprayChart from "@/components/ContactSprayChart";
import { canViewStats } from "@/utils/users";

export default function PlayerDetailsDrawer({
    opened,
    close,
    selectedPlayer,
    user,
    managerView,
    playerHits,
    teamId,
    size,
}) {
    if (!selectedPlayer) return null;

    const showStats = canViewStats(selectedPlayer, user, managerView);

    return (
        <DrawerContainer
            opened={opened}
            onClose={close}
            size={size}
            title={`${selectedPlayer.firstName}'s Details`}
        >
            <TabsWrapper defaultValue="player">
                <Tabs.Tab value="player">
                    <Group gap="xs" align="center" justify="center">
                        <IconBallBaseball size={16} />
                        Player
                    </Group>
                </Tabs.Tab>
                <Tabs.Tab value="personal">
                    <Group gap="xs" align="center" justify="center">
                        <IconUserSquareRounded size={16} />
                        Personal
                    </Group>
                </Tabs.Tab>
                {showStats && (
                    <Tabs.Tab value="spray">
                        <Group gap="xs" align="center" justify="center">
                            <IconMap2 size={16} />
                            Charts
                        </Group>
                    </Tabs.Tab>
                )}

                <Tabs.Panel value="player">
                    <PlayerDetails player={selectedPlayer} teamId={teamId} />
                </Tabs.Panel>

                <Tabs.Panel value="personal">
                    <PersonalDetails
                        user={user}
                        player={selectedPlayer}
                        managerView={managerView}
                    />
                </Tabs.Panel>

                {showStats && (
                    <Tabs.Panel value="spray" pt="lg">
                        <ContactSprayChart hits={playerHits} />
                    </Tabs.Panel>
                )}
            </TabsWrapper>
        </DrawerContainer>
    );
}
