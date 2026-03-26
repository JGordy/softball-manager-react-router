import { useState, useRef } from "react";
import {
    Avatar,
    Button,
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
import fieldStyles from "./GamedayField.module.css";

import DrawerContainer from "@/components/DrawerContainer";
import POSITIONS from "@/constants/positions";

import FieldHighlight from "./FieldHighlight";

import { useRunnerProjection } from "../hooks/useRunnerProjection";
import { getDrawerTitle, getActionColor } from "../utils/drawerUtils";
import {
    getFieldZone,
    getClampedCoordinates,
    getRelativePointerCoordinates,
} from "../utils/fieldMapping";
import ConfirmationPanel from "./ConfirmationPanel";

export default function MobilePlayActionDrawer({
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

    const { runnerResults, setRunnerResults } = useRunnerProjection({
        opened,
        actionType,
        runners,
        outs,
    });

    const positions = Object.entries(POSITIONS).map(([key, pos]) => ({
        label: pos.initials,
        value: pos.initials,
        fullName: key,
        centroid: { x: pos.x ?? 0, y: pos.y ?? 0 },
    }));

    // Reset local state when drawer closes
    if (!opened && selectedPosition !== null) {
        setSelectedPosition(null);
        setHitCoordinates({ x: null, y: null });
        setBattingSide(bats || "right"); // Or default from batter profile if available
    }

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

        const { x, y } = getRelativePointerCoordinates(e, containerRef.current);

        // Constraint within 0-100 before passing to zone clamping
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
        if (location === "foul ball") return false;

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
        return true;
    };

    const renderConfirmation = () => {
        return (
            <ConfirmationPanel
                selectedPosition={selectedPosition}
                hitLocation={hitLocation}
                playerChart={playerChart}
                actionType={actionType}
                runners={runners}
                runnerResults={runnerResults}
                setRunnerResults={setRunnerResults}
                handleConfirm={handleConfirm}
                currentBatter={currentBatter}
                variant="mobile"
                onChangeClick={() => {
                    setHitCoordinates({ x: null, y: null });
                    setSelectedPosition(null);
                }}
            />
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
                                            : "white"
                                    }
                                    variant={
                                        isSelected ? "filled" : "transparent"
                                    }
                                    className={`${fieldStyles.fieldPositionLabel} ${isSelected ? fieldStyles.fieldPositionLabelSelected : ""}`}
                                >
                                    {pos.label}
                                </Avatar>
                            </div>
                        );
                    })}

                    {hitCoordinates.x !== null && (
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
            size="xxl"
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

                {(hitCoordinates.x === null || isDragging) && (
                    <Text size="sm" ta="center" c="dimmed" my="sm">
                        Touch and drag to the appropriate field location where
                        the ball was hit
                    </Text>
                )}

                {hitCoordinates.x === null || isDragging
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
