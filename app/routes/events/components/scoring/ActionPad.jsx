import { Button, SimpleGrid, Stack, Text, Divider } from "@mantine/core";

export default function ActionPad({ onAction }) {
    const onBase = [
        { label: "1B", color: "green", value: "1B" },
        { label: "2B", color: "green", value: "2B" },
        { label: "3B", color: "green", value: "3B" },
        { label: "HR", color: "green", value: "HR" },
        { label: "BB", color: "blue", value: "BB" },
        { label: "ERR", color: "orange", value: "E" },
    ];

    const outs = [
        { label: "K", color: "red", value: "K" },
        { label: "GRD", color: "red", value: "Ground Out" },
        { label: "FLY", color: "red", value: "Fly Out" },
        { label: "LINE", color: "red", value: "Line Out" },
        { label: "POP", color: "red", value: "Pop Out" },
        { label: "FC", color: "orange", value: "FC", variant: "light" },
    ];

    return (
        <Stack gap="xs">
            <Text size="xs" fw={700} c="dimmed" mb={-5}>
                ON BASE
            </Text>
            <SimpleGrid cols={2} spacing="xs">
                {onBase.map((btn) => (
                    <Button
                        key={btn.value}
                        color={btn.color}
                        variant={btn.color === "green" ? "filled" : "light"}
                        radius="md"
                        onClick={() => onAction(btn.value)}
                    >
                        {btn.label}
                    </Button>
                ))}
            </SimpleGrid>

            <Divider my="xs" />

            <Text size="xs" fw={700} c="dimmed" mb={-5}>
                OUTS
            </Text>
            <SimpleGrid cols={2} spacing="xs">
                {outs.map((btn) => (
                    <Button
                        key={btn.value}
                        color={btn.color}
                        variant={btn.variant || "filled"}
                        radius="md"
                        onClick={() => onAction(btn.value)}
                    >
                        {btn.label}
                    </Button>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
