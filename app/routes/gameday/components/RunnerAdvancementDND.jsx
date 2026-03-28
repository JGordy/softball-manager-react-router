import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Box, Text, Paper, Badge, Group, Stack } from "@mantine/core";

import { BASE_POSITIONS } from "@/constants/basePositions";
import { getRelativePointerCoordinates } from "../utils/fieldMapping";
import fieldStyles from "./GamedayField.module.css";
import { getPlayerName } from "../utils/gamedayUtils";

export default function RunnerAdvancementDND({
    runners,
    runnerResults,
    setRunnerResults,
    runsScored,
    outsRecorded,
    playerChart,
    actionType,
    batterId,
    batterName,
    variant = "desktop",
}) {
    const [dragStartPos, setDragStartPos] = useState(null);
    const [dragSourceId, setDragSourceId] = useState(null); // The base ID we started from
    const [activeDraggableId, setActiveDraggableId] = useState(null);
    const [currentPointerPos, setCurrentPointerPos] = useState(null);
    const [lastMovedId, setLastMovedId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredBaseId, setHoveredBaseId] = useState(null);
    const containerRef = useRef(null);

    const isMobile = variant === "mobile";

    // --- SHARED DATA Calculation ---

    const getRunnerName = useCallback(
        (id) => {
            if (!id) return "";
            if (id === batterId && batterName && batterName !== "Batter")
                return batterName;
            return getPlayerName(id, playerChart);
        },
        [batterId, batterName, playerChart, getPlayerName],
    );

    // Each zone is an array because Home (Score) and the OUT zone support multiple runners
    const draggablesByBase = useMemo(() => {
        const groups = {
            "base-home": [],
            "base-1": [],
            "base-2": [],
            "base-3": [],
            "out-zone": [],
        };

        ["third", "second", "first"].forEach((base) => {
            const playerId = runners[base];
            if (playerId) {
                const result = runnerResults[base];
                let currentBase = "out-zone";
                if (result === "score") currentBase = "base-home";
                else if (result === "stay")
                    currentBase = `base-${base === "first" ? "1" : base === "second" ? "2" : "3"}`;
                else if (result === "first") currentBase = "base-1";
                else if (result === "second") currentBase = "base-2";
                else if (result === "third") currentBase = "base-3";
                else if (result === "out") currentBase = "out-zone";
                groups[currentBase].push({
                    id: playerId,
                    name: getRunnerName(playerId),
                });
            }
        });

        if (runnerResults.batter) {
            let currentBase = "out-zone";
            if (runnerResults.batter === "score") currentBase = "base-home";
            else if (runnerResults.batter === "first") currentBase = "base-1";
            else if (runnerResults.batter === "second") currentBase = "base-2";
            else if (runnerResults.batter === "third") currentBase = "base-3";
            else if (runnerResults.batter === "out") currentBase = "out-zone";
            else if (runnerResults.batter === "stay") currentBase = "base-home";
            const bId = batterId || "Batter";
            groups[currentBase].push({ id: bId, name: getRunnerName(bId) });
        }

        return groups;
    }, [runnerResults, runners, batterId, getRunnerName]);

    // --- RULES ENGINE (Shared by DND and Manual Pointer) ---

    const checkMovementRules = (pId, sourceBaseId, targetBaseId) => {
        const sequence = [
            "base-home",
            "base-1",
            "base-2",
            "base-3",
            "base-home",
        ];

        let originalIdx = 0;
        if (runners.first === pId) originalIdx = 1;
        else if (runners.second === pId) originalIdx = 2;
        else if (runners.third === pId) originalIdx = 3;
        else if (pId === (batterId || "Batter")) {
            const normalized = actionType?.toLowerCase();
            if (normalized === "single" || actionType === "1B") originalIdx = 1;
            else if (normalized === "double" || actionType === "2B")
                originalIdx = 2;
            else if (normalized === "triple" || actionType === "3B")
                originalIdx = 3;
            else if (normalized === "homerun" || actionType === "HR")
                originalIdx = 4;
            else originalIdx = 0;
        }

        let targetIdx = sequence.indexOf(targetBaseId);
        // Special case for Home vs Score: if we are at the field and moving to home, it's index 4 (Score)
        if (
            targetBaseId === "base-home" &&
            (sourceBaseId !== "base-home" || originalIdx > 0)
        ) {
            targetIdx = 4;
        }

        // 1. Floor Check: Batter cannot go back before their hit floor.
        // Existing runners can retreat as long as they don't pass anyone else.
        const isBatter = pId === (batterId || "Batter");
        if (
            isBatter &&
            targetBaseId !== "out-zone" &&
            targetIdx < originalIdx
        ) {
            return { allowed: false };
        }

        // 2. No-Passing Calculation (Skipped for Out-Zone)
        if (targetBaseId !== "out-zone") {
            const playerRank =
                pId === (batterId || "Batter")
                    ? 0
                    : runners.third === pId
                      ? 3
                      : runners.second === pId
                        ? 2
                        : 1;

            for (const [key, result] of Object.entries(runnerResults)) {
                const otherId =
                    key === "batter" ? batterId || "Batter" : runners[key];
                if (!otherId || otherId === pId) continue;

                const otherRank =
                    key === "batter"
                        ? 0
                        : key === "third"
                          ? 3
                          : key === "second"
                            ? 2
                            : 1;
                let otherBaseIdx = 0;
                if (result === "score") otherBaseIdx = 4;
                else if (result === "third") otherBaseIdx = 3;
                else if (result === "second") otherBaseIdx = 2;
                else if (result === "first") otherBaseIdx = 1;
                else if (result === "out")
                    otherBaseIdx = 99; // Sentinel for "Out"
                else if (result === "stay") otherBaseIdx = otherRank;

                if (otherBaseIdx !== 99) {
                    // If I am trailing they must stay ahead of me
                    if (playerRank < otherRank && targetIdx > otherBaseIdx)
                        return { allowed: false };
                    // If I am leading they must stay behind me
                    if (playerRank > otherRank && targetIdx < otherBaseIdx)
                        return { allowed: false };
                }
            }
        }

        // 3. Occupancy check (Skipped for Home/Out)
        const isStandardBase =
            targetBaseId === "base-1" ||
            targetBaseId === "base-2" ||
            targetBaseId === "base-3";
        if (isStandardBase) {
            const isOccupied =
                draggablesByBase[targetBaseId].length > 0 &&
                !draggablesByBase[targetBaseId].some((d) => d.id === pId);
            if (isOccupied) return { allowed: false };
        }

        return {
            allowed: true,
            targetValue:
                targetBaseId === "base-home"
                    ? "score"
                    : targetBaseId === "out-zone"
                      ? "out"
                      : targetBaseId === "base-1"
                        ? "first"
                        : targetBaseId === "base-2"
                          ? "second"
                          : "third",
        };
    };

    // --- INTERACTION Handlers ---

    // Desktop/Mouse Move Listener for Ghost Trail (separate from mobile pointer events)
    const handleMouseMove = useCallback(
        (e) => {
            if (!activeDraggableId || !containerRef.current) return;
            const coords = getRelativePointerCoordinates(
                e,
                containerRef.current,
            );
            setCurrentPointerPos(coords);
        },
        [activeDraggableId],
    );

    const handleMouseUp = useCallback(() => {
        if (!isMobile) {
            setDragStartPos(null);
            setDragSourceId(null);
            setActiveDraggableId(null);
            setCurrentPointerPos(null);
        }
    }, [isMobile]);

    useEffect(() => {
        if (!isMobile && activeDraggableId) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isMobile, activeDraggableId, handleMouseMove, handleMouseUp]);

    const onDragStart = (start) => {
        const sourceId = start.source.droppableId;
        const pId = start.draggableId;
        setDragSourceId(sourceId);
        setActiveDraggableId(pId);
        setDragStartPos(BASE_POSITIONS[sourceId]);
    };

    const updatePlayResult = (pId, targetValue) => {
        let sourceKey = null;
        if (pId === (batterId || "Batter")) sourceKey = "batter";
        else if (runners.first === pId) sourceKey = "first";
        else if (runners.second === pId) sourceKey = "second";
        else if (runners.third === pId) sourceKey = "third";

        if (sourceKey) {
            setRunnerResults((prev) => ({ ...prev, [sourceKey]: targetValue }));
            setLastMovedId(pId);
        }
    };

    const onDragEnd = (result) => {
        setDragStartPos(null);
        setDragSourceId(null);
        setActiveDraggableId(null);
        setCurrentPointerPos(null);

        const { destination, draggableId } = result;
        if (!destination) return;

        const { allowed, targetValue } = checkMovementRules(
            draggableId,
            result.source.droppableId,
            destination.droppableId,
        );
        if (allowed) updatePlayResult(draggableId, targetValue);
    };

    // MANUAL POINTER SYSTEM (Mobile Bypass)
    const handlePointerDown = (e, pId = null, bId = null) => {
        if (!isMobile || !containerRef.current) return;

        const coords = getRelativePointerCoordinates(e, containerRef.current);

        // Identify which player was touched. If pId/bId are provided, they win (direct touch on badge).
        // Otherwise, we use proximity-based selection for the container areas.
        let closestPlayer = null;
        let closestBaseId = null;

        if (pId && bId) {
            closestPlayer = { id: pId };
            closestBaseId = bId;
        } else {
            let minDist = 15; // Selection radius in % coords
            Object.entries(draggablesByBase).forEach(([baseId, players]) => {
                if (players.length === 0) return;
                const bPos = BASE_POSITIONS[baseId];
                const dist = Math.sqrt(
                    Math.pow(coords.x - bPos.x, 2) +
                        Math.pow(coords.y - bPos.y, 2),
                );
                if (dist < minDist) {
                    minDist = dist;
                    closestBaseId = baseId;

                    // SMART HEURISTIC: if multiple players are here (like at Home),
                    // favor the one we JUST moved (likely to be the one the user wants to undo/adjust)
                    if (players.length > 1 && lastMovedId) {
                        const lastMoved = players.find(
                            (p) => p.id === lastMovedId,
                        );
                        closestPlayer =
                            lastMoved || players[players.length - 1];
                    } else {
                        closestPlayer = players[players.length - 1]; // Pick top-most
                    }
                }
            });
        }

        if (closestPlayer && closestBaseId) {
            // Prevent default browser behavior (selection/zoom)
            e.preventDefault();

            setDragSourceId(closestBaseId);
            setActiveDraggableId(closestPlayer.id);
            setDragStartPos(BASE_POSITIONS[closestBaseId]);
            setIsDragging(true);
            setCurrentPointerPos(coords);

            // Capture the pointer on the container so move/up events continue to fire
            if (containerRef.current.setPointerCapture) {
                try {
                    containerRef.current.setPointerCapture(e.pointerId);
                } catch {
                    // Ignore capture errors
                }
            }
        }
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !containerRef.current) return;

        // Prevent default browser behavior once the drag is active
        e.preventDefault();

        const coords = getRelativePointerCoordinates(e, containerRef.current);
        setCurrentPointerPos(coords);

        // Calculate closest base for hover effect
        let closestBaseId = null;
        let minDist = 20; // Hover threshold in % coords
        Object.entries(BASE_POSITIONS).forEach(([baseId, bPos]) => {
            const dist = Math.sqrt(
                Math.pow(coords.x - bPos.x, 2) + Math.pow(coords.y - bPos.y, 2),
            );
            if (dist < minDist) {
                minDist = dist;
                closestBaseId = baseId;
            }
        });
        setHoveredBaseId(closestBaseId);
    };

    const handlePointerUp = (e) => {
        if (!isDragging || !activeDraggableId) return;

        e.preventDefault();

        // Release capture on the container
        if (
            containerRef.current &&
            containerRef.current.releasePointerCapture
        ) {
            try {
                containerRef.current.releasePointerCapture(e.pointerId);
            } catch {
                // Ignore capture errors
            }
        }

        if (containerRef.current) {
            const coords = getRelativePointerCoordinates(
                e,
                containerRef.current,
            );

            // Find closest base for dropping
            let targetBaseId = null;
            let minDist = 25; // Dropping threshold
            Object.entries(BASE_POSITIONS).forEach(([baseId, bPos]) => {
                const dist = Math.sqrt(
                    Math.pow(coords.x - bPos.x, 2) +
                        Math.pow(coords.y - bPos.y, 2),
                );
                if (dist < minDist) {
                    minDist = dist;
                    targetBaseId = baseId;
                }
            });

            if (targetBaseId) {
                const { allowed, targetValue } = checkMovementRules(
                    activeDraggableId,
                    dragSourceId,
                    targetBaseId,
                );
                if (allowed) updatePlayResult(activeDraggableId, targetValue);
            }
        }

        // Reset interaction state
        setIsDragging(false);
        setDragStartPos(null);
        setDragSourceId(null);
        setActiveDraggableId(null);
        setCurrentPointerPos(null);
        setHoveredBaseId(null);
    };

    // --- RENDER PIECES ---

    const renderDiamond = () => (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            <path
                d={`M ${BASE_POSITIONS["base-home"].x} ${BASE_POSITIONS["base-home"].y} L ${BASE_POSITIONS["base-1"].x} ${BASE_POSITIONS["base-1"].y} L ${BASE_POSITIONS["base-2"].x} ${BASE_POSITIONS["base-2"].y} L ${BASE_POSITIONS["base-3"].x} ${BASE_POSITIONS["base-3"].y} Z`}
                fill="none"
                stroke="var(--mantine-color-gray-6)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );

    const renderGhostTrail = () => {
        if (!dragStartPos || !currentPointerPos) return null;
        const px = currentPointerPos.x;
        const py = currentPointerPos.y;
        const sequence = [
            "base-home",
            "base-1",
            "base-2",
            "base-3",
            "base-home",
        ];
        let startIdx = sequence.indexOf(dragSourceId);
        let closestBaseIdx = startIdx,
            minDist = Infinity;
        sequence.forEach((baseId, idx) => {
            const dist = Math.sqrt(
                Math.pow(px - BASE_POSITIONS[baseId].x, 2) +
                    Math.pow(py - BASE_POSITIONS[baseId].y, 2),
            );
            if (dist < minDist) {
                minDist = dist;
                closestBaseIdx =
                    baseId === "base-home" && startIdx > 0 ? 4 : idx;
            }
        });
        const outDist = Math.sqrt(
            Math.pow(px - BASE_POSITIONS["out-zone"].x, 2) +
                Math.pow(py - BASE_POSITIONS["out-zone"].y, 2),
        );
        const isHeadingToOut = outDist < minDist && outDist < 20;
        const points = [{ x: dragStartPos.x, y: dragStartPos.y }];
        if (!isHeadingToOut) {
            if (closestBaseIdx > startIdx) {
                // Advancement (Clockwise)
                for (let i = startIdx + 1; i < closestBaseIdx; i++)
                    points.push(BASE_POSITIONS[sequence[i]]);
            } else if (closestBaseIdx < startIdx) {
                // Retreat (Counter-Clockwise)
                for (let i = startIdx - 1; i > closestBaseIdx; i--)
                    points.push(BASE_POSITIONS[sequence[i]]);
            }
        }
        points.push({ x: px, y: py });
        let pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x} ${points[i].y}`;
        }
        return (
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 5,
                }}
            >
                <defs>
                    <filter
                        id="glow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                    >
                        <feGaussianBlur stdDeviation="1.2" result="blur" />
                        <feComposite
                            in="SourceGraphic"
                            in2="blur"
                            operator="over"
                        />
                    </filter>
                </defs>
                <path
                    d={pathData}
                    fill="none"
                    stroke="yellow"
                    strokeWidth="2.5"
                    filter="url(#glow)"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        );
    };

    const renderGhostBadge = () => {
        if (!isMobile || !activeDraggableId || !currentPointerPos) return null;

        let playerName = "Runner";
        // Check batter first
        if (activeDraggableId === (batterId || "Batter")) {
            playerName = batterName || "Batter";
        } else {
            // Find in runners
            ["first", "second", "third"].forEach((base) => {
                if (runners[base] === activeDraggableId) {
                    playerName = getRunnerName(activeDraggableId);
                }
            });
        }

        return (
            <Box
                style={{
                    position: "absolute",
                    left: `${currentPointerPos.x}%`,
                    top: `${currentPointerPos.y}%`,
                    transform: "translate(-50%, -50%) scale(1.1)",
                    zIndex: 1000,
                    pointerEvents: "none",
                }}
            >
                <Badge
                    size="xl"
                    radius="sm"
                    color="blue"
                    variant="filled"
                    className={fieldStyles.runnerBadge}
                    style={{
                        border: "2px solid white",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.5)",
                        whiteSpace: "nowrap",
                        padding: "0 10px",
                        height: 32,
                        minWidth: 60,
                    }}
                    styles={{
                        label: { textTransform: "none", overflow: "visible" },
                    }}
                >
                    {playerName}
                </Badge>
            </Box>
        );
    };

    // --- MAIN RENDER ---

    return (
        <Stack gap="md" mt="sm">
            <Group justify="space-between" align="center">
                <Group gap="xs">
                    {runsScored > 0 && (
                        <Badge size="lg" color="blue" variant="filled">
                            {runsScored} RBI{runsScored > 1 ? "s" : ""}
                        </Badge>
                    )}
                    {outsRecorded > 0 && (
                        <Badge size="lg" color="red" variant="filled">
                            {outsRecorded} OUT{outsRecorded > 1 ? "S" : ""}
                        </Badge>
                    )}
                </Group>
                <Text size="xs" c="dimmed" fw={700}>
                    DRAG RUNNERS TO ADVANCE
                </Text>
            </Group>

            {isMobile ? (
                <Box
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp} // Safety reset
                    onContextMenu={(e) => e.preventDefault()}
                    className={fieldStyles.fieldContainer}
                    style={{
                        backgroundImage:
                            "url('/images/baseball-infield-v2.png')",
                    }}
                >
                    {renderGhostTrail()}
                    {renderGhostBadge()}

                    {/* Render Base Targets for Mobile with CSS Module */}
                    {Object.entries(BASE_POSITIONS).map(([id, pos]) => {
                        const rules = activeDraggableId
                            ? checkMovementRules(
                                  activeDraggableId,
                                  dragSourceId,
                                  id,
                              )
                            : { allowed: true };
                        const isHovered =
                            hoveredBaseId === id && activeDraggableId;
                        const isAllowed = rules.allowed;

                        const targetClasses = [
                            fieldStyles.baseTarget,
                            id === "out-zone" ? fieldStyles.outZone : "",
                            isHovered && isAllowed
                                ? fieldStyles.baseTargetHovered
                                : "",
                            isHovered && !isAllowed
                                ? fieldStyles.baseTargetBlocked
                                : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        const baseOpacity =
                            id === "out-zone" || isAllowed || isHovered
                                ? 1
                                : 0.2;

                        return (
                            <Box
                                key={id}
                                style={{
                                    position: "absolute",
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                    width: 80,
                                    height: 80,
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 1,
                                    opacity: baseOpacity,
                                }}
                            >
                                <Paper
                                    className={targetClasses}
                                    style={{
                                        "--base-rotation":
                                            id === "base-home" ||
                                            id === "out-zone"
                                                ? "0deg"
                                                : "45deg",
                                    }}
                                >
                                    {id === "base-home" && (
                                        <svg
                                            viewBox="0 0 24 24"
                                            style={{
                                                width: 22,
                                                height: 22,
                                                stroke: "white",
                                                strokeWidth: 0.5,
                                                color: isHovered
                                                    ? "white"
                                                    : "rgba(255,255,255,0.6)",
                                                opacity: 0.7,
                                            }}
                                        >
                                            <path
                                                d="M1,1 L23,1 L23,12 L12,23 L1,12 Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    )}
                                    {id === "out-zone" && (
                                        <Stack gap={0} align="center">
                                            <Text
                                                size="10px"
                                                fw={900}
                                                c="white"
                                                style={{
                                                    textShadow:
                                                        "0 1px 2px rgba(0,0,0,0.5)",
                                                }}
                                            >
                                                OUT
                                            </Text>
                                        </Stack>
                                    )}
                                </Paper>
                            </Box>
                        );
                    })}

                    {/* Render Manual Pointer Badges directly */}
                    {Object.entries(BASE_POSITIONS).map(([id, pos]) => (
                        <Box
                            key={id}
                            style={{
                                position: "absolute",
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                width: 100,
                                height: 120,
                                transform: "translate(-50%, -50%)",
                                zIndex: 50,
                                pointerEvents: "none",
                                display: "flex",
                                flexDirection:
                                    id === "base-home"
                                        ? "column-reverse"
                                        : "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                            }}
                        >
                            {draggablesByBase[id].map((p) => {
                                const isBeingDragged =
                                    activeDraggableId === p.id;

                                // On mobile, only hide the source badge if we've dragged a significant amount
                                let isVisuallyGone = isBeingDragged;
                                if (
                                    isBeingDragged &&
                                    isMobile &&
                                    currentPointerPos
                                ) {
                                    const dist = Math.sqrt(
                                        Math.pow(
                                            currentPointerPos.x - pos.x,
                                            2,
                                        ) +
                                            Math.pow(
                                                currentPointerPos.y - pos.y,
                                                2,
                                            ),
                                    );
                                    if (dist < 5) isVisuallyGone = false; // Stay visible for the first 5% of drag
                                }

                                const playerName =
                                    p.id === "Batter" || p.id === batterId
                                        ? batterName || "Batter"
                                        : p.name;

                                return (
                                    <Box
                                        key={p.id}
                                        style={{ pointerEvents: "auto" }}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            handlePointerDown(e, p.id, id);
                                        }}
                                    >
                                        <Badge
                                            size="xl"
                                            radius="sm"
                                            color="blue"
                                            variant="filled"
                                            className={`${fieldStyles.runnerBadge} ${isBeingDragged ? fieldStyles.runnerBadgeDragging : ""}`}
                                            style={{
                                                opacity: isVisuallyGone ? 0 : 1,
                                                padding: "0 10px",
                                                height: 32,
                                                minWidth: 60,
                                            }}
                                            styles={{
                                                label: {
                                                    textTransform: "none",
                                                    overflow: "visible",
                                                    color: "white",
                                                    textShadow:
                                                        "0 1px 2px rgba(0,0,0,0.5)",
                                                },
                                            }}
                                        >
                                            {playerName}
                                        </Badge>
                                    </Box>
                                );
                            })}
                        </Box>
                    ))}
                </Box>
            ) : (
                <DragDropContext
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    disableInteractiveElementBlocking={true}
                >
                    <Box
                        ref={containerRef}
                        className={fieldStyles.fieldContainer}
                    >
                        {renderDiamond()}
                        {renderGhostTrail()}
                        {Object.keys(BASE_POSITIONS).map((id) => (
                            <Droppable
                                key={id}
                                droppableId={id}
                                isDropDisabled={
                                    activeDraggableId
                                        ? !checkMovementRules(
                                              activeDraggableId,
                                              dragSourceId,
                                              id,
                                          ).allowed
                                        : false
                                }
                            >
                                {(provided, snapshot) => {
                                    const isAllowed = activeDraggableId
                                        ? checkMovementRules(
                                              activeDraggableId,
                                              dragSourceId,
                                              id,
                                          ).allowed
                                        : true;
                                    const targetClasses = [
                                        fieldStyles.baseTarget,
                                        id === "out-zone"
                                            ? fieldStyles.outZone
                                            : "",
                                        snapshot.isDraggingOver && isAllowed
                                            ? fieldStyles.baseTargetHovered
                                            : "",
                                        snapshot.isDraggingOver && !isAllowed
                                            ? fieldStyles.baseTargetBlocked
                                            : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ");

                                    return (
                                        <Box
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            style={{
                                                position: "absolute",
                                                left: `${BASE_POSITIONS[id].x}%`,
                                                top: `${BASE_POSITIONS[id].y}%`,
                                                width: 100,
                                                height: 120,
                                                transform:
                                                    "translate(-50%, -50%)",
                                                zIndex: 1,
                                            }}
                                        >
                                            {/* Target Base visual */}
                                            <Box
                                                style={{
                                                    position: "relative",
                                                    width: "100%",
                                                    height: "100%",
                                                    opacity: isAllowed
                                                        ? 1
                                                        : 0.2,
                                                }}
                                            >
                                                <Paper
                                                    className={targetClasses}
                                                    style={{
                                                        "--base-rotation":
                                                            id ===
                                                                "base-home" ||
                                                            id === "out-zone"
                                                                ? "0deg"
                                                                : "45deg",
                                                    }}
                                                >
                                                    {id === "base-home" && (
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            style={{
                                                                width: 22,
                                                                height: 22,
                                                                color: snapshot.isDraggingOver
                                                                    ? "white"
                                                                    : "var(--mantine-color-dark-3)",
                                                            }}
                                                        >
                                                            <path
                                                                d="M1,1 L23,1 L23,12 L12,23 L1,12 Z"
                                                                fill="currentColor"
                                                            />
                                                        </svg>
                                                    )}
                                                    {id === "out-zone" && (
                                                        <Stack
                                                            gap={0}
                                                            align="center"
                                                        >
                                                            <Text
                                                                size="10px"
                                                                fw={900}
                                                                c="white"
                                                            >
                                                                OUT
                                                            </Text>
                                                        </Stack>
                                                    )}
                                                </Paper>

                                                {/* Players for this base (STRICTLY NESTED INSIDE DROPPABLE) */}
                                                <Box
                                                    style={{
                                                        position: "absolute",
                                                        top: 0,
                                                        left: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        zIndex: 50,
                                                        pointerEvents: "none",
                                                        display: "flex",
                                                        flexDirection:
                                                            id === "base-home"
                                                                ? "column-reverse"
                                                                : "column",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        gap: 4,
                                                    }}
                                                >
                                                    {draggablesByBase[id].map(
                                                        (p, index) => (
                                                            <Draggable
                                                                key={p.id}
                                                                draggableId={
                                                                    p.id
                                                                }
                                                                index={index}
                                                            >
                                                                {(
                                                                    draggableProvided,
                                                                    dSnapshot,
                                                                ) => {
                                                                    const child =
                                                                        (
                                                                            <div
                                                                                ref={
                                                                                    draggableProvided.innerRef
                                                                                }
                                                                                {...draggableProvided.draggableProps}
                                                                                {...draggableProvided.dragHandleProps}
                                                                                onContextMenu={(
                                                                                    e,
                                                                                ) =>
                                                                                    e.preventDefault()
                                                                                }
                                                                                className={`${fieldStyles.runnerBadge} ${dSnapshot.isDragging ? fieldStyles.runnerBadgeDragging : ""}`}
                                                                                style={{
                                                                                    ...draggableProvided
                                                                                        .draggableProps
                                                                                        .style,
                                                                                    touchAction:
                                                                                        "none",
                                                                                    zIndex: dSnapshot.isDragging
                                                                                        ? 10000
                                                                                        : 20,
                                                                                    pointerEvents:
                                                                                        "auto",
                                                                                    padding:
                                                                                        "0 10px",
                                                                                    height: 32,
                                                                                    minWidth: 60,
                                                                                    display:
                                                                                        "flex",
                                                                                    alignItems:
                                                                                        "center",
                                                                                    justifyContent:
                                                                                        "center",
                                                                                }}
                                                                                onPointerDown={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    handlePointerDown(
                                                                                        e,
                                                                                        p.id,
                                                                                        id,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Text
                                                                                    size="sm"
                                                                                    fw={
                                                                                        800
                                                                                    }
                                                                                    c="white"
                                                                                    style={{
                                                                                        textShadow:
                                                                                            "0 1px 2px rgba(0,0,0,0.5)",
                                                                                        whiteSpace:
                                                                                            "nowrap",
                                                                                    }}
                                                                                >
                                                                                    {p.id ===
                                                                                        "Batter" ||
                                                                                    p.id ===
                                                                                        batterId
                                                                                        ? batterName ||
                                                                                          "Batter"
                                                                                        : p.name}
                                                                                </Text>
                                                                            </div>
                                                                        );
                                                                    return dSnapshot.isDragging
                                                                        ? createPortal(
                                                                              child,
                                                                              document.body,
                                                                          )
                                                                        : child;
                                                                }}
                                                            </Draggable>
                                                        ),
                                                    )}
                                                </Box>
                                            </Box>
                                            {provided.placeholder}
                                        </Box>
                                    );
                                }}
                            </Droppable>
                        ))}
                    </Box>
                </DragDropContext>
            )}
        </Stack>
    );
}
