import { useState } from "react";
import { useFetcher } from "react-router";

import {
    Button,
    Checkbox,
    Card,
    Divider,
    Group,
    Stack,
    Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconUserPlus,
    IconUserMinus,
    IconTrashX,
    IconCircleCheckFilled,
    IconSquareXFilled,
    IconHelpTriangleFilled,
    IconMessageCircleOff,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import MenuContainer from "@/components/MenuContainer";

const availabilityData = {
    accepted: {
        icon: <IconCircleCheckFilled size={18} color="green" />,
        label: "Accepted",
        order: 0,
    },
    tentative: {
        icon: <IconHelpTriangleFilled size={18} color="orange" />,
        label: "Tentative",
        order: 1,
    },
    declined: {
        icon: <IconSquareXFilled size={18} color="red" />,
        label: "Declined",
        order: 2,
    },
    unknown: {
        icon: <IconMessageCircleOff size={18} color="gray" />,
        label: "Unknown",
        order: 3,
    },
};

export default function LineupMenu({
    game,
    lineupState,
    lineupHandlers,
    playersNotInLineup,
    setHasBeenEdited,
}) {
    const fetcher = useFetcher();

    const [addPlayersDrawerOpened, addPlayersHandlers] = useDisclosure(false);
    const [selectedPlayers, setSelectedPlayers] = useState([]);

    const renderGroupedPlayers = () => {
        // Group players by availability status
        const grouped = (playersNotInLineup ?? []).reduce((acc, player) => {
            const status = player.availability || "unknown";
            if (!acc[status]) acc[status] = [];
            acc[status].push(player);
            return acc;
        }, {});

        // Sort each group alphabetically
        Object.keys(grouped).forEach((status) => {
            grouped[status].sort((a, b) =>
                `${a.lastName} ${a.firstName}`.localeCompare(
                    `${b.lastName} ${b.firstName}`,
                ),
            );
        });

        // Render groups in order
        return Object.keys(availabilityData).map((status) => {
            const players = grouped[status];
            if (!players || players.length === 0) return null;

            return (
                <div key={status} style={{ marginBottom: 16 }}>
                    <Group gap="xs" mb="xs">
                        {availabilityData[status].icon}
                        <Text fw={700} size="sm" c="dimmed">
                            {availabilityData[status].label} ({players.length})
                        </Text>
                    </Group>
                    <Stack gap="xs">
                        {players.map((player) => (
                            <Card key={player.$id} p="0">
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
                    </Stack>
                    {status !== "unknown" && <Divider mt="md" />}
                </div>
            );
        });
    };

    const handleAddPlayer = () => {
        const playersToAdd = (playersNotInLineup ?? []).reduce(
            (acc, player) => {
                if (
                    selectedPlayers.includes(player.$id) &&
                    !lineupState.some((lp) => lp.$id === player.$id)
                ) {
                    acc.push({
                        $id: player.$id,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        gender: player.gender,
                        positions: [],
                    });
                }
                return acc;
            },
            [],
        );

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
            formData.append("playerChart", JSON.stringify(null));

            fetcher.submit(formData, {
                method: "post",
                action: `/events/${game.$id}/lineup`,
            });
        } catch (error) {
            console.error(`Error deleting chart for game ${game.$id}:`, error);
        }

        setHasBeenEdited(false);
        deleteChartHandlers.close();
    };

    const lineupItems = [];

    // Only show Add/Remove Players if there's a player chart
    if (lineupState && lineupState.length > 0) {
        lineupItems.push(
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
                    {renderGroupedPlayers()}
                </Checkbox.Group>
                <Button
                    onClick={handleAddPlayer}
                    mt="md"
                    fullWidth
                    disabled={selectedPlayers.length === 0}
                >
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
                    disabled={selectedPlayers.length === 0}
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
