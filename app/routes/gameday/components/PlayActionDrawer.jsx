import { useState, useEffect, useRef } from "react";
import {
    Avatar,
    Badge,
    Button,
    Divider,
    Group,
    Image,
    Paper,
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
import FieldHighlight from "./FieldHighlight";

import { FIELD_CENTROIDS } from "../constants/fieldCentroids";
import { useRunnerProjection } from "../hooks/useRunnerProjection";
import { getDrawerTitle, getRunnerConfigs } from "../utils/drawerUtils";
import { getFieldZone, getClampedCoordinates } from "../utils/fieldMapping";

const getActionColor = (actionType) => {
    if (["1B", "2B", "3B", "HR"].includes(actionType)) return "lime";
    if (actionType === "E" || actionType === "FC") return "orange";
    return "red";
};

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
    const isSwitchHitter = currentBatter?.bats?.toLowerCase() === "switch";
    const bats = isSwitchHitter
        ? "left"
        : currentBatter?.bats?.toLowerCase() || "right";

    const [selectedPosition, setSelectedPosition] = useState(null);
    const [battingSide, setBattingSide] = useState(bats || "right");
    const [hitCoordinates, setHitCoordinates] = useState({ x: null, y: null });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const hitLocation = getFieldZone(
        hitCoordinates.x,
        hitCoordinates.y,
        actionType,
    );

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
        centroid: FIELD_CENTROIDS[key] || { x: 0, y: 0 },
    }));

    // Reset local state when drawer closes
    useEffect(() => {
        if (!opened) {
            setSelectedPosition(null);
            setHitCoordinates({ x: null, y: null });
            setBattingSide(bats || "right"); // Or default from batter profile if available
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

    const handlePointerEvent = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Constraint within 0-100
        const constrainedX = Math.max(0, Math.min(100, x));
        const constrainedY = Math.max(0, Math.min(100, y));

        // Handle hit boundaries and HR floors
        const { x: finalX, y: finalY } = getClampedCoordinates(
            constrainedX,
            constrainedY,
            actionType,
        );

        // Only update if it's fair territory
        const location = getFieldZone(finalX, finalY, actionType);
        if (location === "foul ball") return;

        setHitCoordinates({ x: finalX, y: finalY });

        // Find nearest position to snap
        let nearestPos = null;
        let minDistance = Infinity;

        // For Fly Outs, only outfielders catch them.
        // For Pop Outs and others, anyone can be the fielder.
        const snapPositions =
            actionType === "Fly Out"
                ? positions.filter((p) =>
                      ["LF", "LC", "RC", "RF"].includes(p.value),
                  )
                : positions;

        snapPositions.forEach((pos) => {
            const snapDx = finalX - pos.centroid.x;
            const snapDy = finalY - pos.centroid.y;
            const snapDist = snapDx * snapDx + snapDy * snapDy;
            if (snapDist < minDistance) {
                minDistance = snapDist;
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
                <Group justify="space-between" my="sm">
                    <Stack gap={0}>
                        <Text size="sm" fw={700}>
                            Fielded by: {selectedPosition}
                        </Text>
                        {hitLocation && (
                            <Text size="xs" c="dimmed">
                                Location: {hitLocation}
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
                    color={getActionColor(actionType)}
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

    const renderFieldInteraction = () => {
        return (
            <Paper radius="md" p="0">
                <div
                    ref={containerRef}
                    className={styles.imageContainer}
                    style={{ touchAction: "none", margin: "10px auto" }}
                    onContextMenu={(e) => e.preventDefault()}
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
                    <FieldHighlight
                        x={hitCoordinates.x}
                        y={hitCoordinates.y}
                        actionType={actionType}
                    />
                    {positions.map((pos) => {
                        const className =
                            styles[
                                pos.fullName.toLowerCase().replace(/\s+/g, "")
                            ];

                        const isSelected = selectedPosition === pos.value;

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
                                    size="sm"
                                    radius="xl"
                                    color={
                                        isSelected
                                            ? getActionColor(actionType)
                                            : "gray"
                                    }
                                    variant={isSelected ? "filled" : "light"}
                                    style={{
                                        transform: isSelected
                                            ? "scale(1.2)"
                                            : "scale(1.1)",
                                        transition: "transform 0.1s ease",
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
                            offset={40}
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
            </Paper>
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
                <Group justify="start">
                    <Text fw={700} size="md">
                        Batting
                    </Text>
                    <SegmentedControl
                        fullWidth
                        value={battingSide}
                        onChange={setBattingSide}
                        data={[
                            { label: "Right", value: "right" },
                            { label: "Left", value: "left" },
                        ]}
                        color="blue"
                    />
                </Group>

                {(!hitCoordinates.x || isDragging) && (
                    <Text size="sm" ta="center" c="dimmed" my="sm">
                        Touch and drag to the appropriate field location where
                        the ball was hit
                    </Text>
                )}

                {!hitCoordinates.x || isDragging
                    ? renderFieldInteraction()
                    : renderConfirmation()}

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
