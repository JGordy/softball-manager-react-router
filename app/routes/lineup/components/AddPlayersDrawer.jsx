import { useState } from "react";
import {
    Button,
    Checkbox,
    Card,
    Divider,
    Group,
    Stack,
    Text,
} from "@mantine/core";
import {
    IconCircleCheckFilled,
    IconSquareXFilled,
    IconHelpTriangleFilled,
    IconMessageCircleOff,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";

const availabilityData = {
    accepted: {
        icon: <IconCircleCheckFilled size={18} color="lime" />,
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

export default function AddPlayersDrawer({
    opened,
    onClose,
    playersNotInLineup,
    lineupState,
    lineupHandlers,
    setHasBeenEdited,
}) {
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
        onClose();
    };

    return (
        <DrawerContainer
            title="Add Players to Lineup"
            opened={opened}
            onClose={onClose}
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
    );
}
