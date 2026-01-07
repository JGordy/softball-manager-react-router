import { Text, Group, Button } from "@mantine/core";
import { IconFlag } from "@tabler/icons-react";
import { useFetcher } from "react-router";

import MenuContainer from "@/components/MenuContainer";
import useModal from "@/hooks/useModal";

export default function ScoringMenu({ gameFinal = false }) {
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
                                    { _action: "end-game" },
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

    const sections = [
        {
            label: "Game Controls",
            items: [
                {
                    key: "end-game",
                    onClick: handleEndGame,
                    leftSection: <IconFlag size={14} />,
                    content: <Text>End Game</Text>,
                    disabled: gameFinal,
                },
            ],
        },
    ];

    return <MenuContainer sections={sections} />;
}
