import { useState } from "react";
import { useFetcher } from "react-router";

import { Button, Checkbox, Card, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { IconUserPlus, IconUserMinus, IconTrashX } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import MenuContainer from "@/components/MenuContainer";

export default function LineupMenu({
    game,
    lineupState,
    lineupHandlers,
    probablePlayers,
    setHasBeenEdited,
}) {
    const fetcher = useFetcher();

    const [addPlayersDrawerOpened, addPlayersHandlers] = useDisclosure(false);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const handleAddPlayer = () => {
        const playersToAdd = (probablePlayers ?? []).reduce((acc, player) => {
            if (selectedPlayers.includes(player.$id)) {
                acc.push({
                    $id: player.$id,
                    firstName: player.firstName,
                    lastName: player.lastName,
                    gender: player.gender,
                    positions: [],
                });
            }
            return acc;
        }, []);

        lineupHandlers.append(...playersToAdd);
        setSelectedPlayers([]);
        setHasBeenEdited(true);
        addPlayersHandlers.close();
    };

    const [removePlayersDrawerOpened, removePlayersHandlers] =
        useDisclosure(false);
    const handleRemovePlayers = (playerIdsToRemove) => {
        // Collect indices to remove
        const indicesToRemove = playerIdsToRemove
            .map((playerId) =>
                lineupState.findIndex((player) => player.$id === playerId),
            )
            .filter((index) => index !== -1);
        // Sort indices descending to avoid index shifting
        indicesToRemove
            .sort((a, b) => b - a)
            .forEach((index) => {
                lineupHandlers.remove(index);
            });
        setHasBeenEdited(true);
        setSelectedPlayers([]);
        removePlayersHandlers.close();
    };

    const [deleteChartDrawerOpened, deleteChartHandlers] = useDisclosure(false);
    const handleDeleteChart = () => {
        lineupHandlers.setState(null);

        try {
            const formData = new FormData();
            formData.append("_action", "save-chart");
            formData.append("playerChart", null);

            fetcher.submit(formData, {
                method: "post",
                action: `/events/${game.$id}/lineup`,
            });
        } catch (error) {
            console.error("Error deleting chart:", error);
        }

        deleteChartHandlers.close();
    };

    const sections = [
        {
            label: "Lineup",
            items: [
                {
                    key: "add-players",
                    onClick: addPlayersHandlers.open,
                    leftSection: <IconUserPlus size={18} />,
                    content: <Text>Add Players</Text>,
                },
                {
                    key: "remove-players",
                    onClick: removePlayersHandlers.open,
                    leftSection: <IconUserMinus size={18} />,
                    content: <Text>Remove Players</Text>,
                },
            ],
        },
        {
            label: "Danger Zone",
            items: [
                {
                    key: "delete-chart",
                    color: "red",
                    onClick: deleteChartHandlers.open,
                    leftSection: <IconTrashX size={18} />,
                    content: <Text>Delete Chart</Text>,
                },
            ],
        },
    ];

    return (
        <>
            <MenuContainer sections={sections} />

            <DrawerContainer
                title="Add Players to Lineup"
                opened={addPlayersDrawerOpened}
                onClose={addPlayersHandlers.close}
                size="xl"
            >
                <Checkbox.Group
                    value={selectedPlayers}
                    onChange={setSelectedPlayers}
                >
                    <div mt="xs">
                        {(probablePlayers ?? []).map((player) => (
                            <Card key={player.$id} p="0" mb="sm">
                                <Checkbox.Card
                                    radius="md"
                                    p="sm"
                                    value={player.$id}
                                >
                                    <Group wrap="nowrap" align="center">
                                        <Checkbox.Indicator />
                                        <div>
                                            <Text>
                                                {player.firstName}{" "}
                                                {player.lastName}
                                            </Text>
                                        </div>
                                    </Group>
                                </Checkbox.Card>
                            </Card>
                        ))}
                    </div>
                </Checkbox.Group>
                <Button onClick={handleAddPlayer} mt="md" fullWidth>
                    Add Selected Players
                </Button>
            </DrawerContainer>

            <DrawerContainer
                title="Remove Players from Lineup"
                opened={removePlayersDrawerOpened}
                onClose={removePlayersHandlers.close}
                size="xl"
            >
                <Checkbox.Group
                    value={selectedPlayers}
                    onChange={setSelectedPlayers}
                >
                    <div mt="xs">
                        {lineupState?.map((player) => (
                            <Card key={player.$id} p="0" mb="sm">
                                <Checkbox.Card
                                    radius="md"
                                    p="sm"
                                    value={player.$id}
                                >
                                    <Group wrap="nowrap" align="center">
                                        <Checkbox.Indicator />
                                        <div>
                                            <Text>
                                                {player.firstName}{" "}
                                                {player.lastName}
                                            </Text>
                                        </div>
                                    </Group>
                                </Checkbox.Card>
                            </Card>
                        ))}
                    </div>
                </Checkbox.Group>
                <Button
                    color="red"
                    onClick={() => handleRemovePlayers(selectedPlayers)}
                    mt="md"
                    fullWidth
                >
                    Remove Selected Players
                </Button>
            </DrawerContainer>

            <DrawerContainer
                title="Delete Lineup"
                opened={deleteChartDrawerOpened}
                onClose={deleteChartHandlers.close}
            >
                <Text>Are you sure you want to delete this lineup?</Text>
                <Text c="red">This action cannot be undone.</Text>
                <Group justify="space-between" mt="xl" grow>
                    <Button
                        variant="filled"
                        onClick={deleteChartHandlers.close}
                    >
                        No, Cancel
                    </Button>
                    <Button
                        variant="outline"
                        color="red"
                        onClick={handleDeleteChart}
                    >
                        Yes, Delete Lineup
                    </Button>
                </Group>
            </DrawerContainer>
        </>
    );
}
