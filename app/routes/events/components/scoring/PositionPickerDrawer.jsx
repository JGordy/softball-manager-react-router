import { useState, useEffect } from "react";
import {
    Button,
    SimpleGrid,
    Group,
    Stack,
    Text,
    Divider,
    SegmentedControl,
} from "@mantine/core";

import DrawerContainer from "@/components/DrawerContainer";
import POSITIONS from "@/constants/positions";

export default function PositionPickerDrawer({
    opened,
    onClose,
    onSelect,
    actionType,
    runners,
}) {
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [runnerResults, setRunnerResults] = useState({});

    const positions = Object.values(POSITIONS).map((pos) => ({
        label: pos.initials,
        value: pos.initials,
    }));

    // Reset local state when drawer closes
    useEffect(() => {
        if (!opened) {
            setSelectedPosition(null);
        }
    }, [opened]);

    // Initial "Guess" for runners based on actionType
    useEffect(() => {
        if (opened) {
            const isHit = ["1B", "2B", "3B", "HR", "E"].includes(actionType);

            const results = {
                first: runners.first ? (isHit ? "second" : "stay") : null,
                second: runners.second ? (isHit ? "third" : "stay") : null,
                third: runners.third ? (isHit ? "score" : "stay") : null,
                batter: isHit ? "first" : "out",
            };

            // Aggressive advancement for extra base hits
            if (isHit) {
                if (actionType === "2B") {
                    results.batter = "second";
                    if (runners.first) results.first = "third";
                    if (runners.second) results.second = "score";
                } else if (actionType === "3B") {
                    results.batter = "third";
                    if (runners.first) results.first = "score";
                    if (runners.second) results.second = "score";
                } else if (actionType === "HR") {
                    results.batter = "score";
                    if (runners.first) results.first = "score";
                    if (runners.second) results.second = "score";
                    if (runners.third) results.third = "score";
                }
            }

            setRunnerResults(results);
        }
    }, [opened, actionType, runners]);

    const getTitle = () => {
        switch (actionType) {
            case "1B":
                return "Single to...";
            case "2B":
                return "Double to...";
            case "3B":
                return "Triple to...";
            case "HR":
                return "Home Run to...";
            case "E":
                return "Error by...";
            case "Ground Out":
                return "Grounded out to...";
            case "Fly Out":
                return "Flies out to...";
            case "Line Out":
                return "Lined out to...";
            case "Pop Out":
                return "Popped out to...";
            default:
                return "Fielded Out by...";
        }
    };

    const getColor = () => {
        if (["1B", "2B", "3B", "HR"].includes(actionType)) return "green";
        if (actionType === "E") return "orange";
        return "red";
    };

    const handleConfirm = () => {
        onSelect({
            position: selectedPosition,
            runnerResults,
        });
    };

    const hasRunners = runners.first || runners.second || runners.third;

    const renderRunners = () => {
        const configs = [
            {
                base: "third",
                label: "Runner on 3rd",
                options: [],
            },
            {
                base: "second",
                label: "Runner on 2nd",
                options: [{ label: "3rd", value: "third" }],
            },
            {
                base: "first",
                label: "Runner on 1st",
                options: [
                    { label: "2nd", value: "second" },
                    { label: "3rd", value: "third" },
                ],
            },
        ];

        return (
            <>
                <Divider label="Runner Advancement" labelPosition="center" />
                <Stack gap="sm">
                    {configs.map(
                        (config) =>
                            runners[config.base] && (
                                <RunnerControl
                                    key={config.base}
                                    label={config.label}
                                    value={runnerResults[config.base]}
                                    onChange={(val) =>
                                        setRunnerResults((prev) => ({
                                            ...prev,
                                            [config.base]: val,
                                        }))
                                    }
                                    intermediateOptions={config.options}
                                />
                            ),
                    )}
                </Stack>
            </>
        );
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title={getTitle()}
            position="bottom"
            size="md"
        >
            <Stack gap="md" pb="xl">
                {!selectedPosition ? (
                    <>
                        <Text size="sm" c="dimmed">
                            Select the defender involved:
                        </Text>
                        <SimpleGrid cols={5} spacing="xs">
                            {positions.map((pos) => (
                                <Button
                                    key={pos.value}
                                    color={getColor()}
                                    variant="filled"
                                    radius="md"
                                    h={60}
                                    onClick={() =>
                                        setSelectedPosition(pos.value)
                                    }
                                >
                                    <Text fw={900} c="white">
                                        {pos.label}
                                    </Text>
                                </Button>
                            ))}
                        </SimpleGrid>
                    </>
                ) : (
                    <>
                        <Group justify="space-between">
                            <Text size="sm" fw={700}>
                                Fielded by: {selectedPosition}
                            </Text>
                            <Button
                                variant="subtle"
                                size="xs"
                                onClick={() => setSelectedPosition(null)}
                            >
                                Change
                            </Button>
                        </Group>

                        {hasRunners && renderRunners()}

                        <Button
                            color={getColor()}
                            fullWidth
                            size="md"
                            radius="md"
                            onClick={handleConfirm}
                            mt="md"
                        >
                            Confirm Play
                        </Button>
                    </>
                )}

                <Button
                    variant="subtle"
                    fullWidth
                    onClick={onClose}
                    color="gray"
                >
                    Cancel
                </Button>
            </Stack>
        </DrawerContainer>
    );
}

function RunnerControl({ label, value, onChange, intermediateOptions = [] }) {
    if (value === null || value === undefined) return null;

    const data = [
        { label: "Stay", value: "stay" },
        ...intermediateOptions,
        { label: "Score", value: "score" },
        { label: "OUT", value: "out" },
    ];

    return (
        <Group gap="xs" justify="space-between" wrap="nowrap">
            <Text size="xs" fw={700} style={{ flexShrink: 0 }}>
                {label}:
            </Text>
            <SegmentedControl
                size="xs"
                color="blue"
                value={value}
                onChange={onChange}
                data={data}
                transitionDuration={200}
                style={{ flex: 1, maxWidth: 300 }}
            />
        </Group>
    );
}
