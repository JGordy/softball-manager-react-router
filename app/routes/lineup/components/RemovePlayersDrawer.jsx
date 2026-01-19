import { useState } from "react";
import { Button, Checkbox, Card, Group, Text } from "@mantine/core";

import DrawerContainer from "@/components/DrawerContainer";

export default function RemovePlayersDrawer({
    opened,
    onClose,
    lineupState,
    lineupHandlers,
    setHasBeenEdited,
}) {
    const [selectedPlayers, setSelectedPlayers] = useState([]);

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
        onClose();
    };

    return (
        <DrawerContainer
            title="Remove Players from Lineup"
            opened={opened}
            onClose={onClose}
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
                                            {player.firstName} {player.lastName}
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
    );
}
