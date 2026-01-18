import { useFetcher } from "react-router";
import { Button, Group, Text } from "@mantine/core";

import DrawerContainer from "@/components/DrawerContainer";

export default function DeleteLineupDrawer({
    opened,
    onClose,
    game,
    actionUrl,
    lineupHandlers,
    setHasBeenEdited,
}) {
    const fetcher = useFetcher();

    const handleDeleteChart = () => {
        lineupHandlers.setState(null);

        try {
            const formData = new FormData();
            formData.append("_action", "save-chart");
            formData.append("playerChart", JSON.stringify(null));

            fetcher.submit(formData, {
                method: "post",
                action: actionUrl,
            });
        } catch (error) {
            console.error(
                `Error deleting chart${game ? ` for game ${game.$id}` : ""}:`,
                error,
            );
        }

        setHasBeenEdited(false);
        onClose();
    };

    return (
        <DrawerContainer
            title="Delete Lineup"
            opened={opened}
            onClose={onClose}
        >
            <Text>Are you sure you want to delete this lineup?</Text>
            <Text c="red">This action cannot be undone.</Text>
            <Group justify="space-between" mt="xl" grow>
                <Button variant="filled" onClick={onClose}>
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
    );
}
