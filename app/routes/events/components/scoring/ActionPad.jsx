import { Button, SimpleGrid, Stack, Text, Divider } from "@mantine/core";

const onBase = [
    { label: "1B", color: "green", value: "1B" },
    { label: "2B", color: "green", value: "2B" },
    { label: "3B", color: "green", value: "3B" },
    { label: "HR", color: "green", value: "HR" },
    { label: "BB", color: "blue", value: "BB" },
    { label: "ERR", color: "orange", value: "E" },
];

const color = "red";
let outs = [
    { label: "K", color, value: "K" },
    { label: "GRD", color, value: "Ground Out" },
    { label: "FLY", color, value: "Fly Out" },
    { label: "LINE", color, value: "Line Out" },
    { label: "POP", color, value: "Pop Out" },
];

export default function ActionPad({ onAction, currentOuts = 0, runners }) {
    const basesEmpty = !runners.first && !runners.second && !runners.third;
    const hasTwoOuts = currentOuts === 2;

    const fielders_choice = {
        label: "FC",
        color: "orange",
        value: "FC",
        variant: "light",
        disabled: basesEmpty || hasTwoOuts,
    };

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
                {[...outs, fielders_choice].map((btn) => (
                    <Button
                        key={btn.value}
                        color={btn.color}
                        variant={btn.variant || "filled"}
                        radius="md"
                        onClick={() => onAction(btn.value)}
                        disabled={btn.disabled}
                    >
                        {btn.label}
                    </Button>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
