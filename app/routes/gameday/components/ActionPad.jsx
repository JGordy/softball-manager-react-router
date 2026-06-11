import { Button, SimpleGrid, Stack, Text } from "@mantine/core";
import { UI_KEYS } from "@/constants/scoring";

const HIT_COLOR = "lime.4";
const onBase = [
    { label: "1B", color: HIT_COLOR, value: UI_KEYS.SINGLE },
    { label: "2B", color: HIT_COLOR, value: UI_KEYS.DOUBLE },
    { label: "3B", color: HIT_COLOR, value: UI_KEYS.TRIPLE },
    { label: "HR", color: HIT_COLOR, value: UI_KEYS.HOMERUN },
    { label: "BB", color: "blue", value: UI_KEYS.WALK, variant: "light" },
    { label: "ERR", color: "orange", value: UI_KEYS.ERROR, variant: "light" },
];

const OUT_COLOR = "red";
const outs = [
    { label: "K", color: OUT_COLOR, value: UI_KEYS.STRIKEOUT },
    { label: "GRD", color: OUT_COLOR, value: UI_KEYS.GROUND_OUT },
    { label: "FLY/POP", color: OUT_COLOR, value: UI_KEYS.FLY_POP },
    { label: "LINE", color: OUT_COLOR, value: UI_KEYS.LINE_OUT },
];

export default function ActionPad({
    onAction,
    runners,
    outs: currentOuts,
    isDesktop = false,
}) {
    const basesEmpty = !runners.first && !runners.second && !runners.third;
    const isTwoOuts = currentOuts === 2;

    const fielders_choice = {
        label: "FC",
        color: "orange",
        value: UI_KEYS.FIELDERS_CHOICE,
        variant: "light",
        disabled: basesEmpty,
    };

    const sac_fly = {
        label: "SF",
        color: "orange",
        value: UI_KEYS.SACRIFICE_FLY,
        variant: "light",
        disabled: basesEmpty || isTwoOuts,
    };

    const onBaseButtons = isDesktop
        ? [
              { label: "1B", color: HIT_COLOR, value: UI_KEYS.SINGLE },
              { label: "2B", color: HIT_COLOR, value: UI_KEYS.DOUBLE },
              {
                  label: "BB",
                  color: "blue",
                  value: UI_KEYS.WALK,
                  variant: "light",
              },
              { label: "3B", color: HIT_COLOR, value: UI_KEYS.TRIPLE },
              { label: "HR", color: HIT_COLOR, value: UI_KEYS.HOMERUN },
              {
                  label: "ERR",
                  color: "orange",
                  value: UI_KEYS.ERROR,
                  variant: "light",
              },
          ]
        : onBase;

    const outsButtons = isDesktop
        ? [
              { label: "K", color: OUT_COLOR, value: UI_KEYS.STRIKEOUT },
              { label: "GRD", color: OUT_COLOR, value: UI_KEYS.GROUND_OUT },
              fielders_choice,
              { label: "FLY/POP", color: OUT_COLOR, value: UI_KEYS.FLY_POP },
              { label: "LINE", color: OUT_COLOR, value: UI_KEYS.LINE_OUT },
              sac_fly,
          ]
        : [...outs, fielders_choice, sac_fly];

    const gridCols = isDesktop ? 3 : 2;

    const renderButton = (btn) => (
        <Button
            key={btn.value}
            className={
                btn.value === UI_KEYS.SINGLE ? "tour-action-1b" : undefined
            }
            color={btn.color}
            variant={btn.variant || "filled"}
            radius="md"
            onClick={() => onAction(btn.value)}
            disabled={btn.disabled}
            px={btn.label.length > 4 ? 4 : undefined}
            fz={btn.label.length > 4 ? "xs" : "sm"}
        >
            {btn.label}
        </Button>
    );

    return (
        <SimpleGrid cols={2} spacing="md" align="flex-start">
            <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" mb={-5} tt="uppercase">
                    ON BASE
                </Text>
                <SimpleGrid cols={gridCols} spacing="xs" verticalSpacing="md">
                    {onBaseButtons.map(renderButton)}
                </SimpleGrid>
            </Stack>

            <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" mb={-5} tt="uppercase">
                    OUTS
                </Text>
                <SimpleGrid cols={gridCols} spacing="xs" verticalSpacing="md">
                    {outsButtons.map(renderButton)}
                </SimpleGrid>
            </Stack>
        </SimpleGrid>
    );
}
