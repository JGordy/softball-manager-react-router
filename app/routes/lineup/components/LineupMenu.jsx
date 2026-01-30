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
            style: {
                backgroundImage: "linear-gradient(90deg, #228be6, #15aabf)",
                borderRadius: "var(--mantine-radius-md)",
                color: "white",
                margin: "5px 0 10px",
            },
            leftSection: <IconSparkles size={20} />,
            content: (
                <Text fw={500} c="white">
                    Generate AI Lineup
                </Text>
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
