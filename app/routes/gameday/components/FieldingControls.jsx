import { useState } from "react";
import { Stack, Text, Group, Button, ActionIcon } from "@mantine/core";
import { IconChevronUp, IconChevronDown } from "@tabler/icons-react";

/**
 * FieldingControls component renders the action controls when our team is on defense.
 * It provides buttons to record an out, score runs for the opponent, or skip to batting.
 * Includes a run counter to score multiple opponent runs with a single click.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onOut - Callback triggered when recording an out.
 * @param {Function} props.onRun - Callback triggered when scoring runs. Receives the number of runs scored.
 * @param {Function} props.onSkip - Callback triggered to advance/skip to batting.
 * @returns {JSX.Element} The rendered FieldingControls component.
 */
export default function FieldingControls({ onOut, onRun, onSkip }) {
    const [runsToScore, setRunsToScore] = useState(1);

    /**
     * Handles run scoring action, submits the current run count,
     * and resets the local run counter back to 1.
     */
    const handleRunClick = () => {
        onRun(runsToScore);
        setRunsToScore(1);
    };

    return (
        <Stack gap="md">
            <Text size="sm" fw={700} c="dimmed">
                FIELDING CONTROLS
            </Text>
            <Group grow>
                <Button h={80} color="red" radius="md" onClick={onOut}>
                    <Text size="md" fw={900}>
                        OUT
                    </Text>
                </Button>
                <Group gap="xs" align="center" wrap="nowrap">
                    <Button
                        h={80}
                        color="lime.4"
                        radius="md"
                        style={{ flex: 1 }}
                        onClick={handleRunClick}
                    >
                        <Text size="md" fw={900}>
                            {runsToScore === 1 ? "RUN" : `${runsToScore} RUNS`}
                        </Text>
                    </Button>
                    <Stack gap={4} justify="center" h={80}>
                        <ActionIcon
                            size={38}
                            variant="filled"
                            color="lime.4"
                            onClick={() => setRunsToScore((prev) => prev + 1)}
                            aria-label="Increase runs"
                        >
                            <IconChevronUp size={20} />
                        </ActionIcon>
                        <ActionIcon
                            size={38}
                            variant="filled"
                            color="lime.4"
                            disabled={runsToScore <= 1}
                            onClick={() =>
                                setRunsToScore((prev) => Math.max(1, prev - 1))
                            }
                            aria-label="Decrease runs"
                        >
                            <IconChevronDown size={20} />
                        </ActionIcon>
                    </Stack>
                </Group>
            </Group>
            <Button variant="filled" color="blue" radius="md" onClick={onSkip}>
                Skip to Batting
            </Button>
        </Stack>
    );
}
