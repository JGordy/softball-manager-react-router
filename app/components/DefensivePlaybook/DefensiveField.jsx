import { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Image } from "@mantine/core";
import images from "@/constants/images";
import styles from "./DefensivePlaybook.module.css";

// Standard starting defensive positions (ASA/USA & USSSA 10-player slow-pitch)
// Calibrated to RostrHQ standard field graphic (Home at 50, 78)
export const DEFAULT_POSITIONS = {
    P: { x: 50, y: 62 },
    C: { x: 50, y: 78 },
    "1B": { x: 66, y: 56 },
    "2B": { x: 57, y: 49 },
    "3B": { x: 34, y: 56 },
    SS: { x: 43, y: 49 },
    LF: { x: 25, y: 35 },
    LC: { x: 40, y: 25 },
    RC: { x: 60, y: 25 },
    RF: { x: 75, y: 35 },
};

// Base coordinates on standard field graphic
export const FIELD_BASE_COORDINATES = {
    "1B": { x: 66, y: 56 },
    "2B": { x: 50, y: 48 },
    "3B": { x: 34, y: 56 },
    Home: { x: 50, y: 78 },
};

export const PRIORITY_COLORS = {
    primary: "#CCFF33", // Neon lime
    cutoff: "#FB923C", // Bright orange
    coverage: "#38BDF8", // Electric sky blue
    backup: "#C084FC", // Purple / Lavender
};

import {
    getSmoothBallState,
    generateTrajectorySegments,
    getFielderInterpolatedPos,
} from "./animationUtils";

/**
 * DefensiveField Component
 *
 * Interactive visual softball diamond displaying all 10 fielders overlayed
 * on RostrHQ's authentic field graphic (images.fieldSrc).
 *
 * @param {Object} props - Component props
 * @param {Object} props.play - Active play scenario data
 * @param {number} [props.timelineStep=0] - Playback progress (0.0 to 1.0)
 * @param {string|null} [props.selectedFielderId=null] - Currently selected fielder posId
 * @param {Function} [props.onSelectFielder] - Fielder selection callback
 * @param {boolean} [props.showVectors=true] - Toggle movement vector arrows
 * @returns {JSX.Element} Field container with authentic graphic and SVG overlay
 */
export default function DefensiveField({
    play,
    timelineStep = 0,
    selectedFielderId = null,
    onSelectFielder = () => {},
    showVectors = true,
}) {
    const runners = play?.situation?.runners || [];
    const ballTimeline = play?.ballTimeline;

    // Calculate smooth continuous ball state along curved trajectory arcs
    const {
        pos: ballPos,
        groundPos: ballGroundPos,
        elevation: ballElevation = 0,
    } = useMemo(() => {
        return getSmoothBallState(
            ballTimeline,
            timelineStep,
            play?.subCategory || "",
        );
    }, [ballTimeline, timelineStep, play?.subCategory]);

    // Build clean curved SVG paths for ball trajectory (Hit: White, Throw: Neon Lime)
    const { hitPath, throwPath } = useMemo(() => {
        return generateTrajectorySegments(
            ballTimeline,
            play?.subCategory || "",
        );
    }, [ballTimeline, play?.subCategory]);

    return (
        <Box className={styles.fieldBox}>
            {/* Authentic RostrHQ Softball Field Graphic */}
            <Image
                src={images.fieldSrc}
                alt="Softball Field"
                className={styles.fieldImage}
                draggable={false}
            />

            {/* Interactive SVG Overlay */}
            <svg
                viewBox="0 0 100 100"
                className={styles.svgOverlay}
                role="img"
                aria-label={`Softball Defensive Field for ${play?.title || "play"}`}
            >
                <defs>
                    {/* Arrow Head Marker for Movement Vectors */}
                    <marker
                        id="arrowPrimary"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="3.2"
                        markerHeight="3.2"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#CCFF33" />
                    </marker>
                    <marker
                        id="arrowCutoff"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="3.2"
                        markerHeight="3.2"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#FB923C" />
                    </marker>
                    <marker
                        id="arrowCoverage"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="3.2"
                        markerHeight="3.2"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38BDF8" />
                    </marker>
                    <marker
                        id="arrowBackup"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="3.2"
                        markerHeight="3.2"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#C084FC" />
                    </marker>
                </defs>

                {/* 1. Base Runner Highlights overlayed on field bags */}
                {runners.includes("1B") && (
                    <g>
                        <circle
                            cx="66"
                            cy="56"
                            r="3.2"
                            fill="rgba(204, 255, 51, 0.3)"
                        />
                        <rect
                            x="64.5"
                            y="54.5"
                            width="3"
                            height="3"
                            transform="rotate(45 66 56)"
                            className={styles.diamondRunnerActive}
                        />
                    </g>
                )}
                {runners.includes("2B") && (
                    <g>
                        <circle
                            cx="50"
                            cy="48"
                            r="3.2"
                            fill="rgba(204, 255, 51, 0.3)"
                        />
                        <rect
                            x="48.5"
                            y="46.5"
                            width="3"
                            height="3"
                            transform="rotate(45 50 48)"
                            className={styles.diamondRunnerActive}
                        />
                    </g>
                )}
                {runners.includes("3B") && (
                    <g>
                        <circle
                            cx="34"
                            cy="56"
                            r="3.2"
                            fill="rgba(204, 255, 51, 0.3)"
                        />
                        <rect
                            x="32.5"
                            y="54.5"
                            width="3"
                            height="3"
                            transform="rotate(45 34 56)"
                            className={styles.diamondRunnerActive}
                        />
                    </g>
                )}

                {/* 2. Ball Flight Trajectory Trails (Hit: White Dotted, Throw: Neon Lime Dashed) */}
                {hitPath && (
                    <path
                        d={hitPath}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="0.85"
                        strokeDasharray="0.1,2.0"
                        strokeLinecap="round"
                        opacity="0.9"
                    />
                )}
                {throwPath && (
                    <path
                        d={throwPath}
                        fill="none"
                        stroke="#CCFF33"
                        strokeWidth="0.85"
                        strokeDasharray="3.0,1.8"
                        opacity="0.9"
                    />
                )}

                {/* 3. Fielder Movement Vectors (Arrows from start to target) */}
                {showVectors &&
                    play?.fielders?.map((f) => {
                        const start = DEFAULT_POSITIONS[f.posId] || {
                            x: 50,
                            y: 50,
                        };
                        const target = f.target || start;
                        const isSelected = selectedFielderId === f.posId;
                        const color = PRIORITY_COLORS[f.priority] || "#38BDF8";

                        const dx = target.x - start.x;
                        const dy = target.y - start.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 1.5) return null;

                        const markerId =
                            f.priority === "primary"
                                ? "url(#arrowPrimary)"
                                : f.priority === "cutoff"
                                  ? "url(#arrowCutoff)"
                                  : f.priority === "backup"
                                    ? "url(#arrowBackup)"
                                    : "url(#arrowCoverage)";

                        return (
                            <line
                                key={`vec-${f.posId}`}
                                x1={start.x}
                                y1={start.y}
                                x2={target.x}
                                y2={target.y}
                                stroke={color}
                                strokeWidth={isSelected ? 1.3 : 0.75}
                                strokeDasharray={isSelected ? "none" : "2,1.8"}
                                opacity={isSelected ? 0.95 : 0.65}
                                markerEnd={markerId}
                            />
                        );
                    })}

                {/* 4. Fielder Nodes (Interpolated by timeline progress) */}
                {play?.fielders?.map((f) => {
                    const start = DEFAULT_POSITIONS[f.posId] || {
                        x: 50,
                        y: 50,
                    };
                    const currentPos = getFielderInterpolatedPos(
                        start,
                        f.target,
                        timelineStep,
                        f.priority,
                    );
                    const isSelected = selectedFielderId === f.posId;
                    const color = PRIORITY_COLORS[f.priority] || "#38BDF8";
                    const isPrimary = f.priority === "primary";

                    return (
                        <g
                            key={`fielder-${f.posId}`}
                            className={`${styles.fielderNode} ${
                                isSelected ? styles.fielderNodeActive : ""
                            }`}
                            onClick={() => onSelectFielder(f.posId)}
                            tabIndex={0}
                            role="button"
                            aria-label={`${f.label} (${f.posId}) - ${f.role}`}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    onSelectFielder(f.posId);
                                }
                            }}
                        >
                            {/* Pulse halo for active selection */}
                            {isSelected && (
                                <circle
                                    cx={currentPos.x}
                                    cy={currentPos.y}
                                    r="5.2"
                                    fill="none"
                                    stroke="#CCFF33"
                                    strokeWidth="1.0"
                                    opacity="0.9"
                                />
                            )}

                            {/* Drop shadow backing circle */}
                            <circle
                                cx={currentPos.x}
                                cy={currentPos.y}
                                r="3.6"
                                fill="#0F172A"
                                opacity="0.6"
                            />

                            {/* Fielder Circle */}
                            <circle
                                cx={currentPos.x}
                                cy={currentPos.y}
                                r="3.4"
                                fill={isPrimary ? "#CCFF33" : "#1E293B"}
                                stroke={color}
                                strokeWidth="1.0"
                            />

                            {/* Position Initials */}
                            <text
                                x={currentPos.x}
                                y={currentPos.y + 1.1}
                                textAnchor="middle"
                                fontSize="2.4"
                                fontWeight="800"
                                fill={isPrimary ? "#111827" : "#FFFFFF"}
                                fontFamily="system-ui, -apple-system, sans-serif"
                            >
                                {f.posId}
                            </text>
                        </g>
                    );
                })}

                {/* 5. Animated Softball with realistic 3D elevation and turf shadow */}
                <g>
                    {/* Ball shadow on turf (tracks ground position directly under the ball) */}
                    <ellipse
                        cx={ballGroundPos?.x ?? ballPos.x}
                        cy={(ballGroundPos?.y ?? ballPos.y) + 0.6}
                        rx={Math.max(0.9, 1.6 - ballElevation * 0.15)}
                        ry={Math.max(0.4, 0.8 - ballElevation * 0.08)}
                        fill="#000000"
                        opacity={Math.max(0.18, 0.35 - ballElevation * 0.05)}
                    />

                    {/* Softball glow */}
                    <circle
                        cx={ballPos.x}
                        cy={ballPos.y}
                        r={2.4 + ballElevation * 0.12}
                        fill="rgba(254, 240, 138, 0.35)"
                    />

                    {/* Softball body (centered precisely on flight path) */}
                    <circle
                        cx={ballPos.x}
                        cy={ballPos.y}
                        r={1.9 + ballElevation * 0.1}
                        fill="#FEF08A"
                        stroke="#CA8A04"
                        strokeWidth="0.4"
                    />

                    {/* Softball red seams */}
                    <path
                        d={`M ${ballPos.x - 1.0} ${
                            ballPos.y - 1.0
                        } Q ${ballPos.x} ${ballPos.y} ${
                            ballPos.x - 1.0
                        } ${ballPos.y + 1.0}`}
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="0.3"
                    />
                    <path
                        d={`M ${ballPos.x + 1.0} ${
                            ballPos.y - 1.0
                        } Q ${ballPos.x} ${ballPos.y} ${
                            ballPos.x + 1.0
                        } ${ballPos.y + 1.0}`}
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="0.3"
                    />
                </g>
            </svg>
        </Box>
    );
}

DefensiveField.propTypes = {
    play: PropTypes.shape({
        title: PropTypes.string,
        situation: PropTypes.shape({
            runners: PropTypes.arrayOf(PropTypes.string),
        }),
        ballTimeline: PropTypes.arrayOf(
            PropTypes.shape({
                step: PropTypes.number.isRequired,
                pos: PropTypes.shape({
                    x: PropTypes.number.isRequired,
                    y: PropTypes.number.isRequired,
                }).isRequired,
                label: PropTypes.string,
            }),
        ),
        fielders: PropTypes.arrayOf(
            PropTypes.shape({
                posId: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
                target: PropTypes.shape({
                    x: PropTypes.number.isRequired,
                    y: PropTypes.number.isRequired,
                }).isRequired,
                role: PropTypes.string.isRequired,
                priority: PropTypes.string.isRequired,
                notes: PropTypes.string,
            }),
        ),
    }),
    timelineStep: PropTypes.number,
    selectedFielderId: PropTypes.string,
    onSelectFielder: PropTypes.func,
    showVectors: PropTypes.bool,
};
