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
} from "@mantine/core";

import images from "@/constants/images";
import styles from "@/styles/positionPicker.module.css";

import DrawerContainer from "@/components/DrawerContainer";
import POSITIONS from "@/constants/positions";

import DiamondView from "./DiamondView";

import { useRunnerProjection } from "../../hooks/useRunnerProjection";
import { getDrawerTitle, getRunnerConfigs } from "../../utils/drawerUtils";

export default function PositionPickerDrawer({
    opened,
    onClose,
    onSelect,
    actionType,
    runners,
    playerChart,
    currentBatter,
    outs,
}) {
    const [selectedPosition, setSelectedPosition] = useState(null);

    const {
        runnerResults,
        setRunnerResults,
        projectedRunners,
        occupiedBases,
        runsScored,
        outsRecorded,
    } = useRunnerProjection({ opened, actionType, runners, outs });

    const positions = Object.entries(POSITIONS).map(([key, pos]) => ({
        label: pos.initials,
        value: pos.initials,
        fullName: key,
    }));

    // Reset local state when drawer closes
    useEffect(() => {
        if (!opened) {
            setSelectedPosition(null);
        }
    }, [opened]);

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
        // Home Runs: No controls needed, everyone scores automatically
        if (actionType === "HR") return null;

        // Inning Over: If the play results in the 3rd out, no runner advancement is possible
        // Calculate outs from the play itself first
        let newOuts = 0;
        if (
            ["Fly Out", "Ground Out", "Line Out", "Pop Out", "K"].includes(
                actionType,
            )
        )
            newOuts = 1;
        // SF is technically an out but allows advancement. But if it's the 3rd out, it doesn't matter.
        if (actionType === "SF") newOuts = 1;

        if ((outs || 0) + newOuts >= 3) {
            return (
                <Text size="sm" c="dimmed" fs="italic" ta="center" mt="sm">
                    Inning over. No runner advancement.
                </Text>
            );
        }

        const configs = getRunnerConfigs(actionType, runners);
        const visibleConfigs = configs.filter((config) => config.shouldShow);

        if (visibleConfigs.length === 0) return null;

        return (
            <Stack gap="sm" mt="sm">
                {visibleConfigs.map((config) => (
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
                        hideStay={config.hideStay}
                    />
                ))}
            </Stack>
        );
    };

    const getPlayerName = (id) => {
        if (!id) return "Empty";
        if (id === "Batter") return "Batter";
        const player = playerChart?.find((p) => p.$id === id);
        return player ? `${player.firstName}` : "Unknown";
    };

    const renderConfirmation = () => {
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

                        {(runsScored > 0 || outsRecorded > 0) && <Divider />}

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
                                    <Text size="sm" fw={500} truncate>
                                        {getPlayerName(
                                            projectedRunners[b.base],
                                        )}
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    </Stack>
                </Group>

                {renderRunners()}

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
            title={getDrawerTitle(actionType, currentBatter)}
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
                                alt="Interactive softball field diagram for position selection"
                                className={styles.fieldImage}
                            />
                            {positions.map((pos) => {
                                const className =
                                    styles[
                                        pos.fullName
                                            .toLowerCase()
                                            .replace(/\s+/g, "")
                                    ];

                                return (
                                    <div
                                        key={pos.value}
                                        className={`${styles.fieldingPosition} ${className}`}
                                        onClick={() =>
                                            setSelectedPosition(pos.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                setSelectedPosition(pos.value);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Select ${pos.fullName} position`}
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

function RunnerControl({
    label,
    value,
    onChange,
    intermediateOptions = [],
    hideStay = false,
}) {
    if (value === null || value === undefined) return null;

    const data = [
        ...(!hideStay ? [{ label: "Stay", value: "stay" }] : []),
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
