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
/**
 * Renders a standardized action button for fielding controls.
 * Keeps button styles, radius, and text sizing consistent.
 *
 * @param {Object} config
 * @param {string} config.className - CSS class name for testing and styling.
 * @param {number|undefined} [config.h=80] - Height of the button.
 * @param {string} config.color - Mantine color theme name.
 * @param {Function} config.onClick - Callback function for click events.
 * @param {string} config.label - Button label text.
 * @param {boolean} [config.disabled=false] - Disabled state.
 * @param {Object} [config.style={}] - Custom styles.
 * @param {string} [config.variant="filled"] - Mantine button variant.
 * @returns {JSX.Element}
 */
const renderButton = ({
    className,
    h = 80,
    color,
    onClick,
    label,
    disabled = false,
    style = {},
    variant = "filled",
}) => (
    <Button
        className={className}
        h={h}
        color={color}
        variant={variant}
        radius="md"
        onClick={onClick}
        disabled={disabled}
        style={style}
    >
        <Text size="md" fw={900}>
            {label}
        </Text>
    </Button>
);

/**
 * Renders a standardized action icon button for run adjustments.
 *
 * @param {Object} config
 * @param {Function} config.onClick - Callback function for click events.
 * @param {boolean} [config.disabled=false] - Disabled state.
 * @param {React.ComponentType} config.icon - Icon component to render.
 * @param {string} config.ariaLabel - Accessible aria-label.
 * @returns {JSX.Element}
 */
const renderRunAdjustIcon = ({
    onClick,
    disabled = false,
    icon: Icon,
    ariaLabel,
}) => (
    <ActionIcon
        size={38}
        variant="filled"
        color="lime.4"
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
    >
        <Icon size={20} />
    </ActionIcon>
);

export default function FieldingControls({
    onOut,
    onRun,
    onSkip,
    isDesktop = false,
    ...props
}) {
    const [runsToScore, setRunsToScore] = useState(1);

    /**
     * Handles run scoring action, submits the current run count,
     * and resets the local run counter back to 1.
     */
    const handleRunClick = () => {
        onRun(runsToScore);
        setRunsToScore(1);
    };

    const OutButton = renderButton({
        className: "tour-fielding-out-btn",
        color: "red",
        onClick: onOut,
        label: "OUT",
    });

    const RunControl = (
        <Group gap="xs" align="center" wrap="nowrap" style={{ flex: 1 }}>
            {renderButton({
                className: "tour-fielding-run-btn",
                color: "lime.4",
                onClick: handleRunClick,
                label: runsToScore === 1 ? "RUN" : `${runsToScore} RUNS`,
                style: { flex: 1 },
            })}
            <Stack gap={4} justify="center" h={80}>
                {renderRunAdjustIcon({
                    onClick: () => setRunsToScore((prev) => prev + 1),
                    icon: IconChevronUp,
                    ariaLabel: "Increase runs",
                })}
                {renderRunAdjustIcon({
                    onClick: () =>
                        setRunsToScore((prev) => Math.max(1, prev - 1)),
                    disabled: runsToScore <= 1,
                    icon: IconChevronDown,
                    ariaLabel: "Decrease runs",
                })}
            </Stack>
        </Group>
    );

    const SkipButton = renderButton({
        className: "tour-fielding-skip-btn",
        h: isDesktop ? 80 : undefined,
        color: "blue",
        onClick: onSkip,
        label: "Skip to Batting",
    });

    return (
        <Stack gap="md" {...props}>
            <Text size="sm" fw={700} c="dimmed">
                FIELDING CONTROLS
            </Text>
            {isDesktop ? (
                <Group grow gap="md" align="stretch">
                    {OutButton}
                    {RunControl}
                    {SkipButton}
                </Group>
            ) : (
                <>
                    <Group grow gap="md">
                        {OutButton}
                        {RunControl}
                    </Group>
                    {SkipButton}
                </>
            )}
        </Stack>
    );
}
