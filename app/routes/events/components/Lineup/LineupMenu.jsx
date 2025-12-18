import { Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconUserPlus,
    IconUserMinus,
    IconTrashX,
    IconSparkles,
} from "@tabler/icons-react";

import { getGameDayStatus } from "@/utils/dateTime";

import MenuContainer from "@/components/MenuContainer";
import AILineupDrawer from "./AILineupDrawer";
import AddPlayersDrawer from "./AddPlayersDrawer";
import RemovePlayersDrawer from "./RemovePlayersDrawer";
import DeleteLineupDrawer from "./DeleteLineupDrawer";

export default function LineupMenu({
    game,
    team,
    actionUrl,
    lineupState,
    lineupHandlers,
    playersNotInLineup,
    players,
    setHasBeenEdited,
}) {
    const [addPlayersDrawerOpened, addPlayersHandlers] = useDisclosure(false);
    const [removePlayersDrawerOpened, removePlayersHandlers] =
        useDisclosure(false);
    const [deleteChartDrawerOpened, deleteChartHandlers] = useDisclosure(false);
    const [aiGenerateDrawerOpened, aiGenerateHandlers] = useDisclosure(false);

    const gameDayStatus = getGameDayStatus(game.gameDate, true);
    const gameIsPast = gameDayStatus === "past";

    const lineupItems = [];

    // AI Generation - always show if we have players if the game is not in the past
    if (!gameIsPast && players && players.length > 0) {
        lineupItems.push({
            key: "generate-ai-lineup",
            onClick: aiGenerateHandlers.open,
            leftSection: (
                <IconSparkles
                    size={20}
                    style={{
                        stroke: "url(#ai-gradient)",
                    }}
                />
            ),
            content: (
                <>
                    <svg width="0" height="0" style={{ position: "absolute" }}>
                        <defs>
                            <linearGradient
                                id="ai-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop offset="0%" stopColor="#228be6" />
                                <stop offset="100%" stopColor="#15aabf" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <Text
                        variant="gradient"
                        gradient={{ from: "blue", to: "cyan", deg: 90 }}
                    >
                        Generate AI Lineup
                    </Text>
                </>
            ),
        });
    }

    // Only show Add/Remove Players if there's a player chart
    if (lineupState && lineupState.length > 0) {
        lineupItems.push(
            {
                key: "add-players",
                onClick: addPlayersHandlers.open,
                leftSection: <IconUserPlus size={20} />,
                content: <Text>Add Players</Text>,
            },
            {
                key: "remove-players",
                onClick: removePlayersHandlers.open,
                leftSection: <IconUserMinus size={20} />,
                content: <Text>Remove Players</Text>,
            },
        );
    }

    const sections = [
        ...(lineupItems.length > 0
            ? [
                  {
                      label: "Lineup",
                      items: lineupItems,
                  },
              ]
            : []),
        {
            label: "Danger Zone",
            items: [
                {
                    key: "delete-chart",
                    color: "red",
                    onClick: deleteChartHandlers.open,
                    leftSection: <IconTrashX size={20} />,
                    content: <Text>Delete Chart</Text>,
                },
            ],
        },
    ];

    return (
        <>
            <MenuContainer sections={sections} />

            <AddPlayersDrawer
                opened={addPlayersDrawerOpened}
                onClose={addPlayersHandlers.close}
                playersNotInLineup={playersNotInLineup}
                lineupState={lineupState}
                lineupHandlers={lineupHandlers}
                setHasBeenEdited={setHasBeenEdited}
            />

            <RemovePlayersDrawer
                opened={removePlayersDrawerOpened}
                onClose={removePlayersHandlers.close}
                lineupState={lineupState}
                lineupHandlers={lineupHandlers}
                setHasBeenEdited={setHasBeenEdited}
            />

            <DeleteLineupDrawer
                opened={deleteChartDrawerOpened}
                onClose={deleteChartHandlers.close}
                game={game}
                actionUrl={actionUrl}
                lineupHandlers={lineupHandlers}
                setHasBeenEdited={setHasBeenEdited}
            />

            <AILineupDrawer
                opened={aiGenerateDrawerOpened}
                onClose={aiGenerateHandlers.close}
                game={game}
                team={team}
                players={players}
                lineupHandlers={lineupHandlers}
                setHasBeenEdited={setHasBeenEdited}
            />
        </>
    );
}
