import { Text, Group, Button } from "@mantine/core";
import { IconFlag, IconPlayerPlay } from "@tabler/icons-react";
import { useFetcher } from "react-router";

import MenuContainer from "@/components/MenuContainer";
import useModal from "@/hooks/useModal";

export default function GamedayMenu({ gameFinal }) {
    const fetcher = useFetcher();
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

    const sections = [
        {
            label: "Game Controls",
            items: [
                gameFinal
                    ? {
                          key: "resume-game",
                          onClick: handleResumeGame,
                          leftSection: <IconPlayerPlay size={14} />,
                          content: <Text>Resume Game</Text>,
                      }
                    : {
                          key: "end-game",
                          onClick: handleEndGame,
                          leftSection: <IconFlag size={14} />,
                          content: <Text>End Game</Text>,
                      },
            ],
        },
    ];

    return <MenuContainer sections={sections} />;
}
