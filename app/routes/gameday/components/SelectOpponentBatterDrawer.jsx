import { useMediaQuery } from "@mantine/hooks";
import { Stack, Text, Button, Group } from "@mantine/core";
import { IconClipboardList } from "@tabler/icons-react";
import DrawerContainer from "@/components/DrawerContainer/DrawerContainer";

export default function SelectOpponentBatterDrawer({
    opened,
    onClose,
    opponentOrderIndex,
    onSelectOpponentBatter,
}) {
    const isDesktop = useMediaQuery("(min-width: 62em)");

    return (
        <DrawerContainer
            size={isDesktop ? "md" : "xl"}
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconClipboardList size={18} />
                    <Text fw={700}>Set Active Opponent Batter</Text>
                </Group>
            }
        >
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Select which batter slot is currently at the plate:
                </Text>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                    }}
                >
                    {Array.from({ length: 12 }).map((_, i) => {
                        const isSelected = opponentOrderIndex === i;
                        return (
                            <Button
                                key={i}
                                variant={isSelected ? "filled" : "outline"}
                                color={isSelected ? "lime" : "gray"}
                                size="md"
                                onClick={() => {
                                    onSelectOpponentBatter?.(i);
                                    onClose();
                                }}
                                styles={(theme) => ({
                                    root: {
                                        height: "48px",
                                        borderColor: isSelected
                                            ? undefined
                                            : "rgba(255, 255, 255, 0.15)",
                                        color: isSelected ? "black" : "white",
                                        backgroundColor: isSelected
                                            ? "var(--mantine-color-lime-4)"
                                            : "rgba(255, 255, 255, 0.03)",
                                        "&:hover": {
                                            backgroundColor: isSelected
                                                ? "var(--mantine-color-lime-5)"
                                                : "rgba(255, 255, 255, 0.08)",
                                        },
                                    },
                                })}
                            >
                                Batter {i + 1}
                            </Button>
                        );
                    })}
                </div>
                <Group justify="center" mt="lg">
                    <Button
                        variant="subtle"
                        color="gray"
                        size="md"
                        onClick={onClose}
                        styles={{ root: { height: "48px", minWidth: "120px" } }}
                    >
                        Cancel
                    </Button>
                </Group>
            </Stack>
        </DrawerContainer>
    );
}
