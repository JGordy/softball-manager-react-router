import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import {
    Button,
    Group,
    Radio,
    Stack,
    Text,
    ThemeIcon,
    Divider,
} from "@mantine/core";

import {
    IconCircleCheckFilled,
    IconHelpTriangleFilled,
    IconSquareXFilled,
} from "@tabler/icons-react";

import DrawerContainer from "@/components/DrawerContainer";
import { trackEvent } from "@/utils/analytics";

const availabilityOptions = [
    {
        value: "accepted",
        label: "Attending",
        description: "Yes, I can make it!",
        icon: <IconCircleCheckFilled size={24} />,
        color: "lime",
    },
    {
        value: "declined",
        label: "Not Attending",
        description: "No, I'm unable to go.",
        icon: <IconSquareXFilled size={24} />,
        color: "red",
    },
    {
        value: "tentative",
        label: "Maybe",
        description: "I'm not sure yet.",
        icon: <IconHelpTriangleFilled size={24} />,
        color: "orange",
    },
];

/**
 * AvailabilityPromptDrawer - Single-user RSVP drawer with 3 options (Attending, Not Attending, Maybe).
 *
 * @param {Object} props
 * @param {boolean} props.opened - Whether the drawer is open
 * @param {() => void} props.onClose - Callback to close the drawer
 * @param {Object} props.game - Game object with at least $id
 * @param {Object} [props.player] - Current user/player object with $id
 * @param {string} [props.userId] - Fallback user ID if player object is not passed
 * @param {string} [props.teamId] - Team ID for the game
 * @param {string} [props.initialStatus] - Pre-selected attendance status if already answered
 * @returns {JSX.Element}
 */
export default function AvailabilityPromptDrawer({
    opened,
    onClose,
    game,
    player,
    userId,
    teamId,
    initialStatus = null,
}) {
    const fetcher = useFetcher();
    const isSubmittingRef = useRef(false);
    const [selected, setSelected] = useState(initialStatus || null);

    const isSubmitting = fetcher.state !== "idle";

    // Synchronize selected state with initialStatus when opened changes
    useEffect(() => {
        if (opened) {
            setSelected(initialStatus || null);
            isSubmittingRef.current = false;
        } else {
            setSelected(null);
            isSubmittingRef.current = false;
        }
    }, [opened, initialStatus]);

    // Only close drawer if this component instance actively submitted the action
    useEffect(() => {
        if (
            isSubmittingRef.current &&
            fetcher.state === "idle" &&
            fetcher.data?.success
        ) {
            isSubmittingRef.current = false;
            onClose();
        }
    }, [fetcher.state, fetcher.data, onClose]);

    const handleSubmit = () => {
        if (!selected) return;

        isSubmittingRef.current = true;
        const effectivePlayerId = player?.$id || player?.id || userId;
        const effectiveTeamId = teamId || game?.teamId;

        const formData = new FormData();
        formData.append("_action", "update-attendance");
        formData.append("playerId", effectivePlayerId);
        formData.append("status", selected);
        formData.append("updatedBy", effectivePlayerId);
        if (effectiveTeamId) {
            formData.append("teamId", effectiveTeamId);
        }

        fetcher.submit(formData, {
            method: "post",
            action: `/events/${game.$id}`,
        });

        trackEvent("submit-event-attendance-prompt", {
            eventId: game.$id,
            status: selected,
        });
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title={
                initialStatus ? "Update Availability" : "Submit Availability"
            }
            size="lg"
        >
            <Stack gap="md" h="100%">
                <Text size="sm" c="dimmed">
                    Please let your coach know if you can make it to this game.
                </Text>

                <Radio.Group value={selected} onChange={setSelected}>
                    <Stack gap="sm">
                        {availabilityOptions.map((item) => (
                            <Radio.Card
                                key={item.value}
                                value={item.value}
                                radius="md"
                                p="md"
                                style={() => ({
                                    backgroundColor: "transparent",
                                    borderWidth: "1px",
                                    borderStyle: "solid",
                                    borderColor:
                                        selected === item.value
                                            ? `var(--mantine-color-${item.color}-6)`
                                            : "light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1))",
                                    transition: "all 0.2s ease",
                                })}
                                data-testid={`availability-option-${item.value}`}
                            >
                                <Group wrap="nowrap" gap="md" align="center">
                                    <ThemeIcon
                                        variant="light"
                                        color={item.color}
                                        size="lg"
                                        radius="xl"
                                    >
                                        {item.icon}
                                    </ThemeIcon>
                                    <Stack gap={2} style={{ flex: 1 }}>
                                        <Text
                                            fw={700}
                                            size="sm"
                                            c={
                                                selected === item.value
                                                    ? item.color
                                                    : undefined
                                            }
                                        >
                                            {item.label}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {item.description}
                                        </Text>
                                    </Stack>
                                    <Radio.Indicator color={item.color} />
                                </Group>
                            </Radio.Card>
                        ))}
                    </Stack>
                </Radio.Group>

                <Divider my="sm" />

                <Stack gap="xs">
                    <Button
                        fullWidth
                        size="md"
                        color="lime"
                        disabled={!selected || isSubmitting}
                        loading={isSubmitting}
                        onClick={handleSubmit}
                    >
                        SUBMIT
                    </Button>
                    <Button
                        fullWidth
                        variant="subtle"
                        color="gray"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Decide Later
                    </Button>
                </Stack>
            </Stack>
        </DrawerContainer>
    );
}
