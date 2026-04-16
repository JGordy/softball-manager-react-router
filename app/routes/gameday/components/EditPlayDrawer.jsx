import { useState, useMemo, useRef } from "react";
import {
    Stack,
    Group,
    Text,
    Button,
    Divider,
    Box,
    Paper,
    Image,
    Avatar,
    Tooltip,
    SegmentedControl,
} from "@mantine/core";
import {
    IconChevronLeft,
    IconBallBaseball,
    IconDirections,
    IconUsers,
    IconWriting,
} from "@tabler/icons-react";
import { getUILabel, EVENT_TYPE_MAP } from "@/constants/scoring";
import POSITIONS from "@/constants/positions";
import images from "@/constants/images";

import styles from "@/styles/positionPicker.module.css";

import { getEventDescription } from "../utils/gamedayUtils";
import {
    getFieldZone,
    getClampedCoordinates,
    getRelativePointerCoordinates,
} from "../utils/fieldMapping";

import DrawerContainer from "@/components/DrawerContainer/DrawerContainer";

import ActionPad from "./ActionPad";
import FieldHighlight from "./FieldHighlight";
import RunnerAdvancementDND from "./RunnerAdvancementDND";

export default function EditPlayDrawer({
    opened,
    onClose,
    log,
    previousLog,
    playerChart,
    onSave,
    isSubmitting,
}) {
    const [activeStep, setActiveStep] = useState("menu");

    // Core State
    const [eventType, setEventType] = useState(() =>
        log ? getUILabel(log.eventType) : "",
    );
    const [runnerResults, setRunnerResults] = useState(() => {
        if (!log) return {};
        try {
            const parsed =
                typeof log.baseState === "string"
                    ? JSON.parse(log.baseState)
                    : log.baseState;
            if (parsed && parsed.runnerResults) {
                return parsed.runnerResults;
            } else if (parsed) {
                const derived = {};
                if (parsed.first === log.playerId) derived.batter = "first";
                else if (parsed.second === log.playerId)
                    derived.batter = "second";
                else if (parsed.third === log.playerId)
                    derived.batter = "third";
                ["first", "second", "third"].forEach((base) => {
                    if (parsed[base] && parsed[base] !== log.playerId)
                        derived[base] = "stay";
                });
                return derived;
            }
        } catch (_e) {
            // ignore
        }
        return {};
    });

    // Location State
    const [hitCoordinates, setHitCoordinates] = useState(() =>
        log ? { x: log.hitX, y: log.hitY } : { x: null, y: null },
    );
    const [selectedPosition, setSelectedPosition] = useState(
        () => log?.hitLocation ?? null,
    );
    const [battingSide, setBattingSide] = useState(
        () => log?.battingSide || "right",
    );
    const [isDragging, setIsDragging] = useState(false);
    const fieldRef = useRef(null);

    // Derived Stats
    const runsScored = useMemo(
        () => Object.values(runnerResults).filter((v) => v === "score").length,
        [runnerResults],
    );

    const outsRecorded = useMemo(
        () => Object.values(runnerResults).filter((v) => v === "out").length,
        [runnerResults],
    );

    const batter = useMemo(
        () =>
            playerChart.find((p) => p.$id === log?.playerId) || {
                firstName: "Batter",
            },
        [log, playerChart],
    );

    const batterName = useMemo(
        () => `${batter.firstName} ${batter.lastName || ""}`.trim(),
        [batter],
    );

    // Full zone string derived from coordinates (e.g. "deep right-center gap")
    const hitLocation = useMemo(() => {
        if (hitCoordinates.x == null || hitCoordinates.y == null) return null;
        const zone = getFieldZone(
            hitCoordinates.x,
            hitCoordinates.y,
            eventType,
        );
        return zone && zone !== "foul ball" ? zone : null;
    }, [hitCoordinates, eventType]);

    // Description is fully derived from current play state
    const description = useMemo(() => {
        if (!eventType || !batterName) return "";
        return getEventDescription(
            eventType,
            batterName,
            selectedPosition,
            runnerResults,
            hitLocation,
        );
    }, [eventType, selectedPosition, runnerResults, batterName, hitLocation]);

    // Starting runners (Pre-play)
    const startingRunners = useMemo(() => {
        if (!previousLog) return { first: null, second: null, third: null };
        try {
            return typeof previousLog.baseState === "string"
                ? JSON.parse(previousLog.baseState)
                : previousLog.baseState;
        } catch (_e) {
            return { first: null, second: null, third: null };
        }
    }, [previousLog]);

    const handleActionChange = (newType) => {
        setEventType(newType);
        const isHit = ["1B", "2B", "3B", "HR", "E", "FC"].includes(newType);
        const isWalk = newType === "BB";
        const results = {
            first: startingRunners.first
                ? isHit
                    ? "second"
                    : isWalk
                      ? "second"
                      : "stay"
                : null,
            second: startingRunners.second
                ? isHit || isWalk
                    ? "third"
                    : "stay"
                : null,
            third: startingRunners.third
                ? isHit || newType === "SF"
                    ? "score"
                    : isWalk
                      ? "score"
                      : "stay"
                : null,
            batter: isHit || isWalk ? "first" : "out",
        };
        if (newType === "2B") {
            results.batter = "second";
            if (startingRunners.first) results.first = "third";
            if (startingRunners.second) results.second = "score";
        } else if (newType === "3B") {
            results.batter = "third";
            if (startingRunners.first) results.first = "score";
            if (startingRunners.second) results.second = "score";
        } else if (newType === "HR") {
            results.batter = "score";
            if (startingRunners.first) results.first = "score";
            if (startingRunners.second) results.second = "score";
            if (startingRunners.third) results.third = "score";
        }
        setRunnerResults(results);
        setActiveStep("menu");
    };

    const handlePointerEvent = (e) => {
        if (!fieldRef.current) return;
        const { x, y } = getRelativePointerCoordinates(e, fieldRef.current);
        const constrainedX = Math.max(0, Math.min(100, x));
        const constrainedY = Math.max(0, Math.min(100, y));
        const { x: finalX, y: finalY } = getClampedCoordinates(
            constrainedX,
            constrainedY,
            eventType,
        );

        const location = getFieldZone(finalX, finalY, eventType);
        if (location === "foul ball") return;

        setHitCoordinates({ x: finalX, y: finalY });

        // Nearest position snap
        let nearestPos = null;
        let minDistance = Infinity;
        const positions = Object.entries(POSITIONS).map(([, pos]) => ({
            label: pos.initials,
            value: pos.initials,
            centroid: { x: pos.x, y: pos.y },
        }));

        positions.forEach((pos) => {
            const dx = finalX - pos.centroid.x;
            const dy = finalY - pos.centroid.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDistance) {
                minDistance = dist;
                nearestPos = pos.value;
            }
        });
        setSelectedPosition(nearestPos);
    };

    const handleSave = () => {
        if (!log) return;
        // Always derive the final baseState from runnerResults + startingRunners
        // so it's correct regardless of whether the user visited the Runners step.
        const derivedBaseState = {
            first: null,
            second: null,
            third: null,
            scored: [],
        };
        const allRunnerIds = {
            batter: log?.playerId,
            first: startingRunners.first,
            second: startingRunners.second,
            third: startingRunners.third,
        };
        Object.entries(runnerResults).forEach(([role, outcome]) => {
            const pId = allRunnerIds[role];
            if (!pId) return;
            if (outcome === "score") {
                derivedBaseState.scored = [
                    ...(derivedBaseState.scored || []),
                    pId,
                ];
            } else if (outcome === "stay") {
                if (role !== "batter") derivedBaseState[role] = pId;
            } else if (["first", "second", "third"].includes(outcome)) {
                derivedBaseState[outcome] = pId;
            }
        });

        onSave(log.$id, {
            eventType: EVENT_TYPE_MAP[eventType] || eventType,
            rbi: runsScored,
            outsOnPlay: outsRecorded,
            description,
            baseState: derivedBaseState,
            runnerResults,
            hitX: hitCoordinates.x,
            hitY: hitCoordinates.y,
            hitLocation: selectedPosition,
            battingSide,
        });
    };

    // Sub-View Renderers
    const renderMenu = () => (
        <Stack gap="md">
            <Group justify="space-between" align="center" px="md" gap="xs">
                {runsScored > 0 && (
                    <StatBadge color="blue">{runsScored} RBI</StatBadge>
                )}
                {outsRecorded > 0 && (
                    <StatBadge color="red">{outsRecorded} OUT</StatBadge>
                )}
            </Group>

            <Paper
                withBorder
                p="md"
                radius="md"
                onClick={() => setActiveStep("result")}
                style={{
                    cursor: "pointer",
                    backgroundColor: "#1F2937",
                    borderColor: "var(--mantine-color-dark-4)",
                }}
            >
                <Group justify="space-between">
                    <Group>
                        <Avatar color="lime" radius="md" variant="light">
                            <IconBallBaseball size={20} />
                        </Avatar>
                        <Box>
                            <Text fw={700}>Change Result</Text>
                            <Text size="xs" c="dimmed">
                                Current: {eventType}
                            </Text>
                        </Box>
                    </Group>
                    <IconChevronLeft
                        style={{ transform: "rotate(180deg)" }}
                        size={16}
                    />
                </Group>
            </Paper>

            <Paper
                withBorder
                p="md"
                radius="md"
                onClick={() => setActiveStep("location")}
                style={{
                    cursor: "pointer",
                    backgroundColor: "#1F2937",
                    borderColor: "var(--mantine-color-dark-4)",
                }}
            >
                <Group justify="space-between">
                    <Group>
                        <Avatar color="blue" radius="md" variant="light">
                            <IconDirections size={20} />
                        </Avatar>
                        <Box>
                            <Text fw={700}>Change Hit Location</Text>
                            <Text size="xs" c="dimmed">
                                {hitLocation
                                    ? hitLocation
                                    : selectedPosition
                                      ? `To ${selectedPosition}`
                                      : "No location set"}
                            </Text>
                        </Box>
                    </Group>
                    <IconChevronLeft
                        style={{ transform: "rotate(180deg)" }}
                        size={16}
                    />
                </Group>
            </Paper>

            <Paper
                withBorder
                p="md"
                radius="md"
                onClick={() => setActiveStep("runners")}
                style={{
                    cursor: "pointer",
                    backgroundColor: "#1F2937",
                    borderColor: "var(--mantine-color-dark-4)",
                }}
            >
                <Group justify="space-between">
                    <Group>
                        <Avatar color="orange" radius="md" variant="light">
                            <IconUsers size={20} />
                        </Avatar>
                        <Box>
                            <Text fw={700}>Change Runners</Text>
                            <Text size="xs" c="dimmed">
                                Adjust base advancements
                            </Text>
                        </Box>
                    </Group>
                    <IconChevronLeft
                        style={{ transform: "rotate(180deg)" }}
                        size={16}
                    />
                </Group>
            </Paper>

            <Divider mt="sm" />

            <Stack gap={4}>
                <Group gap="xs">
                    <IconWriting
                        size={16}
                        color="var(--mantine-color-dimmed)"
                    />
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                        Description
                    </Text>
                </Group>
                <Text size="sm" c="dimmed" fs="italic">
                    {description || "—"}
                </Text>
            </Stack>
        </Stack>
    );

    const renderResultView = () => (
        <Stack gap="md">
            <Group>
                <Button
                    variant="light"
                    color="gray"
                    leftSection={<IconChevronLeft size={16} />}
                    onClick={() => setActiveStep("menu")}
                >
                    Back
                </Button>
                <Text fw={700}>Select Result</Text>
            </Group>
            <ActionPad
                onAction={handleActionChange}
                runners={startingRunners}
                outs={previousLog ? previousLog.outsOnPlay : 0}
            />
        </Stack>
    );

    const renderLocationView = () => (
        <Stack gap="md">
            <Group justify="flex-end">
                <SegmentedControl
                    value={battingSide}
                    onChange={setBattingSide}
                    data={[
                        { label: "Right", value: "right" },
                        { label: "Left", value: "left" },
                    ]}
                    size="xs"
                    color="blue"
                />
            </Group>

            <Paper
                radius="md"
                withBorder
                p="0"
                style={{ position: "relative", overflow: "hidden" }}
            >
                <Box
                    ref={fieldRef}
                    className={styles.imageContainer}
                    style={{ touchAction: "none" }}
                    onPointerDown={(e) => {
                        setIsDragging(true);
                        handlePointerEvent(e);
                    }}
                    onPointerMove={(e) => {
                        if (isDragging) handlePointerEvent(e);
                    }}
                    onPointerUp={() => setIsDragging(false)}
                >
                    <Image src={images.fieldSrc} draggable={false} />
                    <FieldHighlight
                        x={hitCoordinates.x}
                        y={hitCoordinates.y}
                        actionType={eventType}
                    />

                    {Object.entries(POSITIONS).map(([name, pos]) => (
                        <div
                            key={name}
                            className={`${styles.fieldingPosition} ${styles[name.toLowerCase().replace(/\s+/g, "")]}`}
                            style={{
                                position: "absolute",
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                        >
                            <Avatar
                                size="sm"
                                radius="xl"
                                color={
                                    selectedPosition === pos.initials
                                        ? "lime"
                                        : "white"
                                }
                                variant={
                                    selectedPosition === pos.initials
                                        ? "filled"
                                        : "transparent"
                                }
                                style={{
                                    border:
                                        selectedPosition === pos.initials
                                            ? "none"
                                            : "1px solid rgba(255,255,255,0.3)",
                                    color:
                                        selectedPosition === pos.initials
                                            ? "black"
                                            : "white",
                                    fontWeight: 800,
                                }}
                            >
                                {pos.initials}
                            </Avatar>
                        </div>
                    ))}

                    {hitCoordinates.x != null &&
                        (() => {
                            const zone = getFieldZone(
                                hitCoordinates.x,
                                hitCoordinates.y,
                                eventType,
                            );
                            return (
                                <Tooltip
                                    label={zone || "Touch the field"}
                                    opened={!!zone && isDragging}
                                    position="top"
                                    offset={40}
                                    withinPortal={false}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: `${hitCoordinates.x}%`,
                                            top: `${hitCoordinates.y}%`,
                                            width: 10,
                                            height: 10,
                                            backgroundColor: "white",
                                            borderRadius: "50%",
                                            border: "2px solid var(--mantine-color-lime-filled)",
                                            transform: "translate(-50%, -50%)",
                                            pointerEvents: "none",
                                            zIndex: 10,
                                        }}
                                    />
                                </Tooltip>
                            );
                        })()}
                </Box>
            </Paper>
            {/* Persistent zone label — always visible below the field */}
            <Text size="xs" ta="center" c="dimmed">
                {hitCoordinates.x != null
                    ? getFieldZone(
                          hitCoordinates.x,
                          hitCoordinates.y,
                          eventType,
                      ) || "Drag to adjust where the ball was hit"
                    : "Drag to adjust where the ball was hit"}
            </Text>
            <Button
                fullWidth
                size="md"
                color="lime"
                c="black"
                fw={700}
                onClick={() => setActiveStep("menu")}
            >
                Done
            </Button>
        </Stack>
    );

    const renderRunnersView = () => (
        <Stack gap="md">
            <Group>
                <Text fw={700}>Baserunning</Text>
            </Group>
            <Box style={{ position: "relative" }}>
                <RunnerAdvancementDND
                    runners={startingRunners}
                    runnerResults={runnerResults}
                    setRunnerResults={(results) => {
                        setRunnerResults(results);
                    }}
                    runsScored={runsScored}
                    outsRecorded={outsRecorded}
                    playerChart={playerChart}
                    actionType={eventType}
                    batterId={log?.playerId}
                    batterName={batterName}
                    variant="mobile"
                />
            </Box>
            <Button
                fullWidth
                size="md"
                color="lime"
                c="black"
                fw={700}
                onClick={() => setActiveStep("menu")}
            >
                Done
            </Button>
        </Stack>
    );

    return (
        <DrawerContainer
            size="xl"
            opened={opened}
            onClose={onClose}
            padding="sm"
            title={
                <Box px="md" py="xs">
                    <Text fw={800} size="lg">
                        Edit Play
                    </Text>
                    <Text size="xs" c="dimmed">
                        {batterName} • {eventType}
                    </Text>
                </Box>
            }
        >
            <Stack h="100%" gap={0}>
                <Box
                    style={{ flex: 1 }}
                    px={activeStep === "runners" ? 4 : "md"}
                    pt="md"
                >
                    {activeStep === "menu" && renderMenu()}
                    {activeStep === "result" && renderResultView()}
                    {activeStep === "location" && renderLocationView()}
                    {activeStep === "runners" && renderRunnersView()}
                </Box>

                {activeStep === "menu" && (
                    <Box p="md">
                        <Button
                            fullWidth
                            size="lg"
                            color="lime"
                            c="black"
                            fw={800}
                            onClick={handleSave}
                            loading={isSubmitting}
                        >
                            Save Changes
                        </Button>
                    </Box>
                )}
            </Stack>
        </DrawerContainer>
    );
}

const StatBadge = ({ children, color }) => (
    <Paper
        px={8}
        py={2}
        radius="sm"
        bg={color}
        style={{ display: "inline-block" }}
    >
        <Text size="xs" fw={800} c="white" tt="uppercase">
            {children}
        </Text>
    </Paper>
);
