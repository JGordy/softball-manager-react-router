import { Button, SimpleGrid, Stack, Text, Divider } from "@mantine/core";

const HIT_COLOR = "green";
const onBase = [
    { label: "1B", color: HIT_COLOR, value: "1B" },
    { label: "2B", color: HIT_COLOR, value: "2B" },
    { label: "3B", color: HIT_COLOR, value: "3B" },
    { label: "HR", color: HIT_COLOR, value: "HR" },
    { label: "BB", color: "blue", value: "BB", variant: "light" },
    { label: "ERR", color: "orange", value: "E", variant: "light" },
];

const OUT_COLOR = "red";
const outs = [
    { label: "K", color: OUT_COLOR, value: "K" },
    { label: "GRD", color: OUT_COLOR, value: "Ground Out" },
    { label: "FLY", color: OUT_COLOR, value: "Fly Out" },
    { label: "LINE", color: OUT_COLOR, value: "Line Out" },
    { label: "POP", color: OUT_COLOR, value: "Pop Out" },
];

export default function ActionPad({ onAction, runners }) {
    const basesEmpty = !runners.first && !runners.second && !runners.third;

    const fielders_choice = {
        label: "FC",
        color: "orange",
        value: "FC",
        variant: "light",
        disabled: basesEmpty,
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
                        variant={btn.variant}
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
