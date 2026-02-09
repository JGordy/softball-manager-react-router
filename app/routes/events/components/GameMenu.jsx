import { Text } from "@mantine/core";

import { IconEdit, IconScoreboard, IconTrashX } from "@tabler/icons-react";

import AddGameResults from "@/forms/AddGameResults";
import AddSingleGame from "@/forms/AddSingleGame";

import useModal from "@/hooks/useModal";

import { formatForViewerTime } from "@/utils/dateTime";
import MenuContainer from "@/components/MenuContainer";

export default function GameMenu({
    game = {},
    gameIsPast,
    openDeleteDrawer = () => {},
    result,
    season = {},
    team = {},
}) {
    const { openModal } = useModal();

    const openGameResultsModal = () =>
        openModal({
            title: "Add Results for this game",
            children: (
                <AddGameResults
                    actionRoute={`/events/${game.$id}`}
                    teamId={team.$id}
                    defaults={{
                        score: game?.score || 0,
                        opponentScore: game?.opponentScore || 0,
                        result: game?.result || null,
                    }}
                />
            ),
        });

    const openEditGameModal = () =>
        openModal({
            title: "Update Game Details",
            children: (
                <AddSingleGame
                    action="update-game"
                    actionRoute={`/events/${game.$id}`}
                    defaults={{
                        isHomeGame: game.isHomeGame,
                        gameTime: formatForViewerTime(
                            game.gameDate,
                            game.timeZone,
                            { format: "HH:mm" },
                        ),
                        gameDate: game.gameDate,
                        location: game.location || season.location,
                        locationNotes: game.locationNotes,
                    }}
                    teamId={team.$id}
                    seasonId={season.$id}
                    confirmText="Update Game"
                />
            ),
        });

    const sections = [
        {
            label: "Game Details",
            items: [
                ...(gameIsPast
                    ? [
                          {
                              key: "results",
                              onClick: openGameResultsModal,
                              leftSection: <IconScoreboard size={14} />,
                              content: (
                                  <Text>{`${result ? "Update" : "Add"} game results`}</Text>
                              ),
                          },
                      ]
                    : []),
                {
                    key: "edit",
                    onClick: openEditGameModal,
                    leftSection: <IconEdit size={14} />,
                    content: <Text>Edit Game Details</Text>,
                },
            ],
        },
        {
            label: "Danger zone",
            items: [
                {
                    key: "delete",
                    leftSection: <IconTrashX size={14} />,
                    color: "red",
                    onClick: openDeleteDrawer,
                    content: <Text>Delete Game</Text>,
                },
            ],
        },
    ];

    return <MenuContainer sections={sections} />;
}
