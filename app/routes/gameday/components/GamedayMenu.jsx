import { useFetcher, Link, useParams } from "react-router";
import { Text, Group, Button } from "@mantine/core";
import {
    IconFlag,
    IconPlayerPlay,
    IconArrowsExchange,
    IconClipboardList,
} from "@tabler/icons-react";

import MenuContainer from "@/components/MenuContainer";
import useModal from "@/hooks/useModal";

export default function GamedayMenu({
    gameFinal,
    score,
    opponentScore,
    onSubBatter,
}) {
    const fetcher = useFetcher();
    const { eventId } = useParams();
    const { openModal, closeAllModals } = useModal();

    const handleEndGame = () => {
        openModal({
            title: "End Game",
            children: (
                <>
                    <Text size="sm" mb="md">
                        Are you sure you want to end this game? This will
                        prevent any further scoring changes.
                    </Text>
                    <Group justify="flex-end" mt="xl">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={closeAllModals}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            onClick={() => {
                                fetcher.submit(
                                    {
                                        _action: "end-game",
                                        gameFinal: true,
                                        score,
                                        opponentScore,
                                    },
                                    { method: "post" },
                                );
                                closeAllModals();
                            }}
                        >
                            End Game
                        </Button>
                    </Group>
                </>
            ),
        });
    };

    const handleResumeGame = () => {
        openModal({
            title: "Resume Game",
            children: (
                <>
                    <Text size="sm" mb="md">
                        Are you sure you want to resume this game? This will
                        enable scoring controls again.
                    </Text>
                    <Group justify="flex-end" mt="xl">
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={closeAllModals}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="blue"
                            onClick={() => {
                                fetcher.submit(
                                    {
                                        _action: "resume-game",
                                        gameFinal: false,
                                    },
                                    { method: "post" },
                                );
                                closeAllModals();
                            }}
                        >
                            Resume Game
                        </Button>
                    </Group>
                </>
            ),
        });
    };

    const gameControls = [
        {
            key: "edit-lineup",
            component: Link,
            to: `/events/${eventId}/lineup`,
            leftSection: <IconClipboardList size={14} />,
            content: <Text>Edit Lineup</Text>,
        },
        ...(gameFinal
            ? [
                  {
                      key: "resume-game",
                      onClick: handleResumeGame,
                      leftSection: <IconPlayerPlay size={14} />,
                      content: <Text>Resume Game</Text>,
                  },
              ]
            : [
                  {
                      key: "end-game",
                      onClick: handleEndGame,
                      leftSection: <IconFlag size={14} />,
                      content: <Text>End Game</Text>,
                  },
              ]),
    ];

    // Only show Sub Batter when the game is active and a sub callback is provided
    if (!gameFinal && onSubBatter) {
        gameControls.unshift({
            key: "sub-batter",
            onClick: onSubBatter,
            leftSection: <IconArrowsExchange size={14} />,
            content: <Text>Sub Current Batter</Text>,
        });
    }

    const sections = [
        {
            label: "Game Controls",
            items: gameControls,
        },
    ];

    return <MenuContainer sections={sections} />;
}
