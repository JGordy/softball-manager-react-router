import { useState, useEffect } from "react";
import {
    Button,
    Group,
    Stack,
    Text,
    Divider,
    SegmentedControl,
    Avatar,
    Image,
    Badge,
    ThemeIcon,
} from "@mantine/core";
import { IconRun, IconOutbound } from "@tabler/icons-react";

import images from "@/constants/images";
import styles from "@/styles/positionPicker.module.css";

import DrawerContainer from "@/components/DrawerContainer";
import POSITIONS from "@/constants/positions";
import DiamondView from "./DiamondView";

export default function PositionPickerDrawer({
    opened,
    onClose,
    onSelect,
    actionType,
    runners,
    playerChart,
    currentBatter,
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
            const isHit = ["1B", "2B", "3B", "HR", "E", "FC"].includes(
                actionType,
            );

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
        const name = currentBatter?.firstName || "Batter";

        switch (actionType) {
            case "1B":
                return `${name} singles to...`;
            case "2B":
                return `${name} doubles to...`;
            case "3B":
                return `${name} triples to...`;
            case "HR":
                return `${name} homers to...`;
            case "E":
                return `${name} reaches on error by...`;
            case "FC":
                return `${name} reaches on FC to...`;
            case "SF":
                return `${name} sac flies to...`;
            case "Ground Out":
                return `${name} grounds out to...`;
            case "Fly Out":
                return `${name} flies out to...`;
            case "Line Out":
                return `${name} lines out to...`;
            case "Pop Out":
                return `${name} pops out to...`;
            default:
                return `${name} - Select Position`;
        }
    };

    const getColor = () => {
        if (["1B", "2B", "3B", "HR"].includes(actionType)) return "green";
        if (actionType === "E" || actionType === "FC") return "orange";
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
            <Stack gap="sm" mt="sm">
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
        );
    };

    // Preload field image
    useEffect(() => {
        const img = new window.Image();
        img.src = images.fieldSrc;
    }, []);

    const getProjectedState = () => {
        // Track WHO is on which base (playerId or null)
        const projectedRunners = { first: null, second: null, third: null };
        const occupiedBases = { first: false, second: false, third: false };
        let runsScored = 0;
        let outsRecorded = 0;

        // Note: We don't have the batter's ID easily available here without passing it down
        // or finding it from the game state. For now, we might handle "batter" generically
        // or require the batterId to be passed.
        // HOWEVER: The visual feedback might just need to know "someone" is there.
        // But for the list on the right, we want names.
        // Let's assume we can't easily get the batter's name without more props,
        // BUT we can track the existing runners by ID.
        // Determining the batter's identity might be tricky if not passed.
        // Let's just use a placeholder "Batter" if we don't have the ID,
        // OR better: The user sees "Batter" in the UI anyway.

        // Helper to process a result
        const processResult = (result, runnerId, sourceBase) => {
            if (!result) return;
            if (result === "score") {
                runsScored++;
            } else if (result === "out") {
                outsRecorded++;
            } else if (["first", "second", "third"].includes(result)) {
                projectedRunners[result] = runnerId;
                occupiedBases[result] = true;
            } else if (result === "stay" && sourceBase) {
                projectedRunners[sourceBase] = runnerId;
                occupiedBases[sourceBase] = true;
            }
        };

        // Process batter - we'll treat them as a special "Batter" entity if we don't have ID
        // actually, we don't need the ID for the batter in the `runners` map if we just show "Batter"
        // But wait, if R1 goes to 2nd, and Batter goes to 1st.
        if (runnerResults.batter) {
            processResult(runnerResults.batter, "Batter", null);
        }

        // Process existing runners
        const bases = ["first", "second", "third"];
        bases.forEach((base) => {
            if (runners[base]) {
                const result = runnerResults[base];
                processResult(result, runners[base], base);
            }
        });

        return { projectedRunners, occupiedBases, runsScored, outsRecorded };
    };

    const getPlayerName = (id) => {
        if (!id) return "Empty";
        if (id === "Batter") return "Batter";
        const player = playerChart?.find((p) => p.$id === id);
        return player ? `${player.firstName}` : "Unknown";
    };

    const renderConfirmation = () => {
        const { projectedRunners, occupiedBases, runsScored, outsRecorded } =
            getProjectedState();

        return (
            <>
                <Group justify="space-between" mb="xs">
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

                <Divider label="Runner Advancement" labelPosition="center" />

                <Group align="start" grow wrap="nowrap">
                    {/* Left Column: Visual Diamond */}
                    <Stack align="center" gap="xs">
                        <DiamondView
                            runners={occupiedBases}
                            withTitle={false}
                        />
                    </Stack>

                    {/* Right Column: Runners List & Stats */}
                    <Stack gap="sm" pl="xs">
                        {/* Badges First */}
                        {(runsScored > 0 || outsRecorded > 0) && (
                            <Group gap="xs">
                                {runsScored > 0 && (
                                    <Badge size="md" color="blue">
                                        {runsScored} RBI
                                        {runsScored > 1 ? "s" : ""}
                                    </Badge>
                                )}
                                {outsRecorded > 0 && (
                                    <Badge size="md" color="red">
                                        {outsRecorded} OUT
                                        {outsRecorded > 1 ? "S" : ""}
                                    </Badge>
                                )}
                            </Group>
                        )}

                        {runsScored > 0 || (outsRecorded > 0 && <Divider />)}

                        <Stack gap="xs">
                            <Text size="xs" fw={700} c="dimmed">
                                PROJECTED RUNNERS
                            </Text>
                            {[
                                { base: "third", label: "3rd" },
                                { base: "second", label: "2nd" },
                                { base: "first", label: "1st" },
                            ].map((b) => (
                                <Group
                                    key={b.base}
                                    justify="space-between"
                                    wrap="nowrap"
                                >
                                    <Badge
                                        variant="filled"
                                        color="gray"
                                        size="sm"
                                        w={40}
                                    >
                                        {b.label}
                                    </Badge>
                                    <Text
                                        size="sm"
                                        fw={500}
                                        style={{
                                            textOverflow: "ellipsis",
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {getPlayerName(
                                            projectedRunners[b.base],
                                        )}
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    </Stack>
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
        );
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title={getTitle()}
            position="bottom"
            size="lg"
            keepMounted
        >
            <Stack gap="md" pb="xl">
                {!selectedPosition ? (
                    <>
                        <Text size="sm" c="dimmed">
                            Select the defender involved:
                        </Text>

                        <div className={styles.imageContainer}>
                            <Image
                                src={images.fieldSrc}
                                alt="Softball Field"
                                className={styles.fieldImage}
                            />
                            {positions.map((pos) => {
                                const positionKey = Object.keys(POSITIONS).find(
                                    (key) =>
                                        POSITIONS[key].initials === pos.value,
                                );
                                const className = positionKey
                                    ? styles[
                                          positionKey
                                              .toLowerCase()
                                              .replace(/\s+/g, "")
                                      ]
                                    : "";

                                return (
                                    <div
                                        key={pos.value}
                                        className={`${styles.fieldingPosition} ${className}`}
                                        onClick={() =>
                                            setSelectedPosition(pos.value)
                                        }
                                    >
                                        <Avatar
                                            size="md"
                                            radius="xl"
                                            color={getColor()}
                                            variant="filled"
                                        >
                                            {pos.label}
                                        </Avatar>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    renderConfirmation()
                )}

                <Button
                    variant="light"
                    radius="md"
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
