import { useState, useEffect, useRef } from "react";
import { Stack, Text, Button, ThemeIcon } from "@mantine/core";
import { IconChartBar, IconListDetails } from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import { trackEvent } from "@/utils/analytics";

/**
 * @typedef {"Detailed" | "Basic"} ScoringMode
 */

/**
 * Content configuration keyed by the currently active scoring mode.
 *
 * @type {Record<ScoringMode, { icon: React.ReactNode, headline: string, body: string, switchLabel: string, keepLabel: string }>}
 */
const CONTENT = {
    Detailed: {
        icon: <IconListDetails size={40} />,
        headline: "Faster scoring available",
        body: "Basic mode lets you record Outs, Runs, or skip the inning with 3 taps — great for quickly moving past the opponent's at-bat without tracking every batter.",
        switchLabel: "Switch to Basic",
        keepLabel: "Keep Detailed",
    },
    Basic: {
        icon: <IconChartBar size={40} />,
        headline: "Want more detail?",
        body: "Detailed mode tracks each at-bat individually, builds a contact spray chart, and gives you a full box score for the opponent.",
        switchLabel: "Switch to Detailed",
        keepLabel: "Keep Basic",
    },
};

/**
 * A non-dismissable drawer that appears once — at inning 1, first opponent at-bat,
 * before any opponent plays are recorded — to surface the alternative scoring mode.
 *
 * The parent is responsible for only mounting this component when the trigger
 * conditions are met. Once mounted, the drawer opens after a short delay.
 * A `useRef` prevents re-opening if the component re-mounts before a play is logged.
 *
 * @param {object} props
 * @param {ScoringMode} props.opponentScoringMode - The currently active opponent scoring mode.
 * @param {() => void} props.onSwitchMode - Callback invoked when the user chooses to switch modes.
 */
export default function ScoringModeNudgeDrawer({
    opponentScoringMode,
    onSwitchMode,
}) {
    const [opened, setOpened] = useState(false);
    const hasShownRef = useRef(false);

    useEffect(() => {
        if (hasShownRef.current) return;

        // Small delay so the drawer doesn't fire simultaneously with the
        // half-inning transition animation.
        const timer = setTimeout(() => {
            setOpened(true);
            hasShownRef.current = true;
            trackEvent("scoring-mode-nudge-impression", {
                currentMode: opponentScoringMode,
            });
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    /**
     * Handles the user's choice.
     *
     * @param {boolean} switchMode - True if the user chose to switch modes.
     */
    const handleChoice = (switchMode) => {
        setOpened(false);
        trackEvent("scoring-mode-nudge-choice", {
            currentMode: opponentScoringMode,
            choice: switchMode ? "switch" : "keep",
        });
        if (switchMode) onSwitchMode();
    };

    const content = CONTENT[opponentScoringMode] ?? CONTENT.Detailed;

    return (
        <DrawerContainer
            opened={opened}
            onClose={() => {}}
            withCloseButton={false}
            closeOnClickOutside={false}
            closeOnEscape={false}
            title="Opponent Scoring Mode"
            size="lg"
        >
            <Stack gap="lg" pb="md" align="center">
                <ThemeIcon
                    size={80}
                    radius={26}
                    variant="gradient"
                    gradient={{ from: "lime.7", to: "lime.4" }}
                    color="lime"
                    style={{ boxShadow: "0 8px 30px rgba(204, 255, 51, 0.2)" }}
                >
                    {content.icon}
                </ThemeIcon>

                <Stack gap={4} align="center">
                    <Text ta="center" size="xl" fw={700}>
                        {content.headline}
                    </Text>
                    <Text
                        ta="center"
                        c="dimmed"
                        style={{ maxWidth: 300, lineHeight: 1.5 }}
                    >
                        {content.body}
                    </Text>
                </Stack>

                <Stack w="100%" gap="xs">
                    <Button
                        onClick={() => handleChoice(true)}
                        size="md"
                        radius="md"
                        fullWidth
                        variant="gradient"
                        gradient={{ from: "lime.7", to: "lime.4" }}
                        styles={{
                            root: {
                                color: "#111827",
                                fontWeight: 700,
                                transition: "transform 0.15s ease",
                                "&:active": { transform: "scale(0.97)" },
                            },
                        }}
                    >
                        {content.switchLabel}
                    </Button>
                    <Button
                        onClick={() => handleChoice(false)}
                        size="md"
                        radius="md"
                        fullWidth
                        variant="subtle"
                        color="gray"
                    >
                        {content.keepLabel}
                    </Button>
                </Stack>
            </Stack>
        </DrawerContainer>
    );
}
