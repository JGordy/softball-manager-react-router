import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
    Group,
    Slider,
    ActionIcon,
    Tooltip,
    SegmentedControl,
    Switch,
    Stack,
    Box,
} from "@mantine/core";
import { IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react";
import styles from "./DefensivePlaybook.module.css";

/**
 * PlayTimelineControls Component
 *
 * Provides timeline scrubbing, automatic playback loop, speed toggles,
 * keyframe step indicators, and display options.
 *
 * @param {Object} props - Component props
 * @param {number} props.timelineStep - Current step value (0.0 to 1.0)
 * @param {Function} props.setTimelineStep - Step setter function
 * @param {boolean} props.isPlaying - Whether animation is currently running
 * @param {Function} props.setIsPlaying - Play/pause toggle function
 * @param {number} props.playbackSpeed - Current playback speed multiplier (0.5, 1, 1.5, 2)
 * @param {Function} props.setPlaybackSpeed - Speed setter function
 * @param {Array<Object>} props.ballTimeline - Keyframe timeline points of the active play
 * @param {boolean} props.showVectors - Toggle movement arrows
 * @param {Function} props.setShowVectors - Movement arrows toggle setter
 * @returns {JSX.Element}
 */
export default function PlayTimelineControls({
    timelineStep,
    setTimelineStep,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    ballTimeline = [],
    showVectors,
    setShowVectors,
}) {
    const animationFrameRef = useRef(null);
    const lastTimestampRef = useRef(null);

    // Continuous smooth animation loop using requestAnimationFrame
    useEffect(() => {
        if (!isPlaying) {
            lastTimestampRef.current = null;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        const durationMs = 4500 / playbackSpeed; // Natural slow-pitch play pacing

        const animate = (timestamp) => {
            if (!lastTimestampRef.current) {
                lastTimestampRef.current = timestamp;
            }
            const delta = timestamp - lastTimestampRef.current;
            lastTimestampRef.current = timestamp;

            setTimelineStep((prev) => {
                const next = prev + delta / durationMs;
                if (next >= 1.0) {
                    setIsPlaying(false);
                    return 1.0;
                }
                return next;
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, playbackSpeed, setIsPlaying, setTimelineStep]);

    // Milestone keyframe tick dots on the track
    const marks = ballTimeline.map((item) => ({
        value: Math.round(item.step * 100),
    }));

    return (
        <Stack gap="xs" className={styles.controlBar} mt="xs">
            {/* Control row: Speed on left, Play button in center, Arrows toggle on right */}
            <Group
                justify="space-between"
                align="center"
                wrap="nowrap"
                gap="xs"
                px="xs"
            >
                <Box
                    style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "flex-start",
                    }}
                >
                    <SegmentedControl
                        size="sm"
                        value={String(playbackSpeed)}
                        onChange={(val) => setPlaybackSpeed(Number(val))}
                        data={[
                            { label: "0.5x", value: "0.5" },
                            { label: "1.0x", value: "1" },
                        ]}
                        aria-label="Playback speed"
                    />
                </Box>

                <Box style={{ display: "flex", justifyContent: "center" }}>
                    <Tooltip
                        label={
                            isPlaying
                                ? "Pause"
                                : timelineStep >= 0.99
                                  ? "Replay"
                                  : "Play Animation"
                        }
                    >
                        <ActionIcon
                            variant="filled"
                            color="lime"
                            size="xl"
                            radius="md"
                            onClick={() => {
                                if (timelineStep >= 0.99) {
                                    setTimelineStep(0.0);
                                }
                                setIsPlaying(!isPlaying);
                            }}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <IconPlayerPause size={24} color="#111827" />
                            ) : (
                                <IconPlayerPlay size={24} color="#111827" />
                            )}
                        </ActionIcon>
                    </Tooltip>
                </Box>

                <Box
                    style={{
                        flex: 1,
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <Switch
                        size="sm"
                        color="lime"
                        label="Arrows"
                        checked={showVectors}
                        onChange={(e) =>
                            setShowVectors(e.currentTarget.checked)
                        }
                        aria-label="Toggle movement arrows"
                    />
                </Box>
            </Group>

            {/* Scrubber slider */}
            <Box px="xs" pb="xs" pt={4}>
                <Slider
                    value={Math.round(timelineStep * 100)}
                    onChange={(val) => {
                        setTimelineStep(val / 100);
                        if (isPlaying) setIsPlaying(false);
                    }}
                    min={0}
                    max={100}
                    step={1}
                    color="lime"
                    size="sm"
                    label={(val) => `${val}%`}
                    marks={marks.length > 0 ? marks : undefined}
                    thumbProps={{ "aria-label": "Play timeline progress" }}
                    aria-label="Play timeline progress"
                />
            </Box>
        </Stack>
    );
}

PlayTimelineControls.propTypes = {
    timelineStep: PropTypes.number.isRequired,
    setTimelineStep: PropTypes.func.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    setIsPlaying: PropTypes.func.isRequired,
    playbackSpeed: PropTypes.number.isRequired,
    setPlaybackSpeed: PropTypes.func.isRequired,
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
    showVectors: PropTypes.bool.isRequired,
    setShowVectors: PropTypes.func.isRequired,
};
