import PropTypes from "prop-types";
import { Stack, Group, Text, Box, Button } from "@mantine/core";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import styles from "./DefensivePlaybook.module.css";

/**
 * MiniDiamond Component
 *
 * Renders a clean SVG mini diamond indicating runner occupancy on 1B, 2B, and 3B.
 *
 * @param {Object} props
 * @param {Array<string>} props.runners - Array containing "1B", "2B", "3B"
 * @returns {JSX.Element}
 */
export function MiniDiamond({ runners = [] }) {
    const has1B = runners.includes("1B");
    const has2B = runners.includes("2B");
    const has3B = runners.includes("3B");

    return (
        <svg
            viewBox="0 0 32 32"
            width="32"
            height="32"
            aria-label={`Runners: ${runners.length > 0 ? runners.join(", ") : "Bases Empty"}`}
            role="img"
        >
            {/* Basepath outline */}
            <polygon
                points="16,27 25,18 16,9 7,18"
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1.5"
            />
            {/* Pitcher Rubber */}
            <rect
                x="15"
                y="17.5"
                width="2"
                height="1"
                fill="rgba(255, 255, 255, 0.45)"
                rx="0.5"
            />
            {/* Home Plate */}
            <polygon
                points="16,28.5 14,26.5 14,25.5 18,25.5 18,26.5"
                fill="#FFFFFF"
                opacity="0.9"
            />
            {/* 1st Base */}
            <rect
                x="22.5"
                y="15.5"
                width="5"
                height="5"
                transform="rotate(45 25 18)"
                className={
                    has1B
                        ? styles.diamondRunnerActive
                        : styles.diamondRunnerEmpty
                }
            />
            {/* 2nd Base */}
            <rect
                x="13.5"
                y="6.5"
                width="5"
                height="5"
                transform="rotate(45 16 9)"
                className={
                    has2B
                        ? styles.diamondRunnerActive
                        : styles.diamondRunnerEmpty
                }
            />
            {/* 3rd Base */}
            <rect
                x="4.5"
                y="15.5"
                width="5"
                height="5"
                transform="rotate(45 7 18)"
                className={
                    has3B
                        ? styles.diamondRunnerActive
                        : styles.diamondRunnerEmpty
                }
            />
        </svg>
    );
}

MiniDiamond.propTypes = {
    runners: PropTypes.arrayOf(PropTypes.string),
};

/**
 * SituationOverview Component
 *
 * Displays the base-out state, batter hand, one clean play title/description,
 * the mini diamond runner indicator, and a direct "Select Scenario" action button.
 *
 * @param {Object} props - Component props
 * @param {Object} props.play - The active play scenario
 * @param {Function} [props.onOpenSelector] - Action to open the scenario picker drawer
 * @returns {JSX.Element}
 */
export default function SituationOverview({ play, onOpenSelector = () => {} }) {
    if (!play) return null;

    const situation = play.situation || {};
    const runners = situation.runners || [];
    const outs = situation.outs ?? 0;

    const baseText =
        runners.length === 0
            ? "Bases Empty"
            : runners.length === 3
              ? "Bases Loaded"
              : `Runner${runners.length > 1 ? "s" : ""} on ${runners.join(" & ")}`;

    const batterText = situation.batterHand === "L" ? "LHH" : "RHH";

    return (
        <Box className={styles.situationContainer}>
            <Stack gap={4} align="center">
                <Text className={styles.playHeadline} ta="center">
                    {play.title}
                </Text>

                <Group justify="center" align="center" gap="xs" wrap="wrap">
                    <Box className={styles.diamondWrapper}>
                        <MiniDiamond runners={runners} />
                    </Box>
                    <Text
                        size="xs"
                        fw={700}
                        c={runners.length > 0 ? "#CCFF33" : "#CBD5E1"}
                    >
                        {baseText}
                    </Text>
                    <Text size="xs" c="dimmed">
                        •
                    </Text>
                    <Group gap={3} align="center">
                        <Text size="xs" fw={700} c="#94A3B8">
                            OUTS
                        </Text>
                        <span
                            className={
                                outs >= 1
                                    ? styles.outDotActive
                                    : styles.outDotInactive
                            }
                        />
                        <span
                            className={
                                outs >= 2
                                    ? styles.outDotActive
                                    : styles.outDotInactive
                            }
                        />
                        <Text
                            size="xs"
                            fw={700}
                            c={outs > 0 ? "#FB923C" : "#94A3B8"}
                        >
                            ({outs})
                        </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                        •
                    </Text>
                    <Text size="xs" fw={700} c="#38BDF8">
                        {batterText}
                    </Text>
                    {play.subCategory && (
                        <>
                            <Text size="xs" c="dimmed">
                                •
                            </Text>
                            <Text size="xs" fw={600} c="#94A3B8">
                                {play.subCategory}
                            </Text>
                        </>
                    )}
                </Group>

                <Button
                    variant="subtle"
                    color="lime"
                    size="compact-xs"
                    radius="xl"
                    leftSection={<IconAdjustmentsHorizontal size={14} />}
                    onClick={onOpenSelector}
                    aria-label="Select play or situation"
                    className={styles.selectScenarioPill}
                    mt={2}
                >
                    Select Scenario
                </Button>
            </Stack>
        </Box>
    );
}

SituationOverview.propTypes = {
    play: PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        category: PropTypes.string,
        subCategory: PropTypes.string,
        situation: PropTypes.shape({
            outs: PropTypes.number,
            runners: PropTypes.arrayOf(PropTypes.string),
            batterHand: PropTypes.string,
            hitType: PropTypes.string,
            description: PropTypes.string,
        }),
    }),
    onOpenSelector: PropTypes.func,
};
