import { Button, SimpleGrid, Stack, Text } from "@mantine/core";
import { UI_KEYS } from "@/constants/scoring";

const HIT_COLOR = "lime.4";
const onBase = [
    { label: "1B", color: HIT_COLOR, value: UI_KEYS.SINGLE },
    { label: "2B", color: HIT_COLOR, value: UI_KEYS.DOUBLE },
    { label: "3B", color: HIT_COLOR, value: UI_KEYS.TRIPLE },
    { label: "HR", color: HIT_COLOR, value: UI_KEYS.HOMERUN },
    { label: "BB", color: "blue", value: UI_KEYS.WALK },
    { label: "ERR", color: "orange", value: UI_KEYS.ERROR },
];

const OUT_COLOR = "red";
const outs = [
    { label: "K", color: OUT_COLOR, value: UI_KEYS.STRIKEOUT },
    { label: "GRD", color: OUT_COLOR, value: UI_KEYS.GROUND_OUT },
    { label: "FLY", color: OUT_COLOR, value: UI_KEYS.FLY_OUT },
    { label: "LINE", color: OUT_COLOR, value: UI_KEYS.LINE_OUT },
    { label: "POP", color: OUT_COLOR, value: UI_KEYS.POP_OUT },
];

export default function ActionPad({ onAction, runners, outs: currentOuts }) {
    const basesEmpty = !runners.first && !runners.second && !runners.third;
    const isTwoOuts = currentOuts === 2;

    const fielders_choice = {
        label: "FC",
        color: "orange",
        value: UI_KEYS.FIELDERS_CHOICE,
        disabled: basesEmpty,
    };

    const sac_fly = {
        label: "SF",
        color: "orange",
        value: UI_KEYS.SACRIFICE_FLY,
        disabled: basesEmpty || isTwoOuts,
    };

    return (
        <SimpleGrid cols={2} spacing="md" align="flex-start" mb="md">
            <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" mb={-5} tt="uppercase">
                    ON BASE
                </Text>
                <SimpleGrid cols={2} spacing="xs" verticalSpacing="md">
                    {onBase.map((btn) => (
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

            <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" mb={-5} tt="uppercase">
                    OUTS
                </Text>
                <SimpleGrid cols={2} spacing="xs" verticalSpacing="md">
                    {[...outs, fielders_choice, sac_fly].map((btn) => (
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
        </SimpleGrid>
    );
}
