import { useState, useEffect, useRef } from "react";
import {
    Avatar,
    Badge,
    Button,
    Divider,
    Group,
    Image,
    Card,
    SegmentedControl,
    Stack,
    Text,
    Tooltip,
} from "@mantine/core";

import images from "@/constants/images";
import styles from "@/styles/positionPicker.module.css";

import DrawerContainer from "@/components/DrawerContainer";
import POSITIONS from "@/constants/positions";

import DiamondView from "./DiamondView";

import { useRunnerProjection } from "../../hooks/useRunnerProjection";
import { getDrawerTitle, getRunnerConfigs } from "../../utils/drawerUtils";
import { getFieldZone } from "../../utils/fieldMapping";

export default function PlayActionDrawer({
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
    const [battingSide, setBattingSide] = useState("right");
    const [hitCoordinates, setHitCoordinates] = useState({ x: null, y: null });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (currentBatter?.battingSide) {
            setBattingSide(currentBatter.battingSide.toLowerCase());
        }
    }, [currentBatter, opened]);

    const hitLocation = getFieldZone(hitCoordinates.x, hitCoordinates.y);

    const {
        runnerResults,
        setRunnerResults,
        projectedRunners,
        occupiedBases,
        runsScored,
        outsRecorded,
    } = useRunnerProjection({ opened, actionType, runners, outs });

    const positions = Object.entries(POSITIONS).map(([key, pos]) => {
        // Map centroids from CSS for snap logic
        const centroids = {
            Pitcher: { x: 50, y: 62 },
            Catcher: { x: 50, y: 78 },
            "First Base": { x: 66, y: 56 },
            "Second Base": { x: 57, y: 49 },
            "Third Base": { x: 34, y: 56 },
            Shortstop: { x: 43, y: 49 },
            "Left Field": { x: 25, y: 35 },
            "Left Center Field": { x: 40, y: 25 },
            "Right Center Field": { x: 60, y: 25 },
            "Right Field": { x: 75, y: 35 },
        };

        return {
            label: pos.initials,
            value: pos.initials,
            fullName: key,
            centroid: centroids[key] || { x: 0, y: 0 },
        };
    });

    // Reset local state when drawer closes
    useEffect(() => {
        if (!opened) {
            setSelectedPosition(null);
            setHitCoordinates({ x: null, y: null });
            setBattingSide("right"); // Or default from batter profile if available
        }
    }, [opened]);

    const handleConfirm = () => {
        onSelect({
            position: selectedPosition,
            runnerResults,
            hitCoordinates,
            hitLocation,
            battingSide,
        });
    };

    const getColor = () => {
        if (["1B", "2B", "3B", "HR"].includes(actionType)) return "green";
        if (actionType === "E" || actionType === "FC") return "orange";
        return "red";
    };

    const handlePointerEvent = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Constraint within 0-100
        const constrainedX = Math.max(0, Math.min(100, x));
        const constrainedY = Math.max(0, Math.min(100, y));

        // Only update if it's fair territory
        const location = getFieldZone(constrainedX, constrainedY);
        if (location === "foul ball") return;

        setHitCoordinates({ x: constrainedX, y: constrainedY });

        // Find nearest position to snap
        let nearestPos = null;
        let minDistance = Infinity;

        positions.forEach((pos) => {
            const dx = constrainedX - pos.centroid.x;
            const dy = constrainedY - pos.centroid.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDistance) {
                minDistance = dist;
                nearestPos = pos.value;
            }
        });

        setSelectedPosition(nearestPos);
    };

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
                    <Stack gap={0}>
                        <Text size="sm" fw={700}>
                            Fielded by: {selectedPosition}
                        </Text>
                        {hitLocation && (
                            <Text size="xs" c="dimmed">
                                Location: {hitLocation} (
                                {battingSide === "left" ? "L" : "R"})
                            </Text>
                        )}
                    </Stack>
                    <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => {
                            setSelectedPosition(null);
                            setHitCoordinates({ x: null, y: null });
                        }}
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
            size="xl"
            keepMounted
        >
            <Stack gap="md" pb="xl">
                <Group justify="center">
                    <Text size="lg">Batting:</Text>
                    <SegmentedControl
                        fullWidth
                        value={battingSide}
                        onChange={setBattingSide}
                        data={[
                            { label: "Left", value: "left" },
                            { label: "Right", value: "right" },
                        ]}
                        color="blue"
                    />
                </Group>

                <Text size="sm" c="dimmed">
                    Select approximate field location where the ball was hit
                </Text>

                {!hitCoordinates.x || isDragging ? (
                    <Card radius="md" p="0" pt="md" withBorder>
                        <div
                            ref={containerRef}
                            className={styles.imageContainer}
                            style={{ touchAction: "none" }}
                            onPointerDown={(e) => {
                                setIsDragging(true);
                                handlePointerEvent(e);
                            }}
                            onPointerMove={(e) => {
                                if (isDragging) {
                                    handlePointerEvent(e);
                                }
                            }}
                            onPointerUp={() => setIsDragging(false)}
                            onPointerLeave={() => setIsDragging(false)}
                        >
                            <Image
                                src={images.fieldSrc}
                                alt="Interactive softball field diagram"
                                className={styles.fieldImage}
                                draggable={false}
                            />
                            {positions.map((pos) => {
                                const className =
                                    styles[
                                        pos.fullName
                                            .toLowerCase()
                                            .replace(/\s+/g, "")
                                    ];

                                const isSelected =
                                    selectedPosition === pos.value;

                                return (
                                    <div
                                        key={pos.value}
                                        className={`${styles.fieldingPosition} ${className}`}
                                        onClick={() => {
                                            setSelectedPosition(pos.value);
                                            // If just clicked, set coords to centroid
                                            setHitCoordinates(pos.centroid);
                                        }}
                                        tabIndex={0}
                                        role="button"
                                    >
                                        <Avatar
                                            size="md"
                                            radius="xl"
                                            color={
                                                isSelected ? getColor() : "gray"
                                            }
                                            variant={
                                                isSelected ? "filled" : "light"
                                            }
                                            style={{
                                                transform: isSelected
                                                    ? "scale(1.2)"
                                                    : "scale(1)",
                                                transition:
                                                    "transform 0.1s ease",
                                                border: isSelected
                                                    ? "2px solid white"
                                                    : "none",
                                            }}
                                        >
                                            {pos.label}
                                        </Avatar>
                                    </div>
                                );
                            })}

                            {hitCoordinates.x && (
                                <Tooltip
                                    label={hitLocation || "Touch the field"}
                                    opened={!!hitLocation && isDragging}
                                    position="top"
                                    offset={15}
                                    withinPortal={false}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: `${hitCoordinates.x}%`,
                                            top: `${hitCoordinates.y}%`,
                                            width: 12,
                                            height: 12,
                                            backgroundColor: "white",
                                            borderRadius: "50%",
                                            border: "2px solid var(--mantine-color-blue-filled)",
                                            transform: "translate(-50%, -50%)",
                                            pointerEvents: "none",
                                            zIndex: 5,
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </Card>
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
