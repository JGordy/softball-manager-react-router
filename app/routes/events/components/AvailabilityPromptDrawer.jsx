import { useEffect, useState } from "react";
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

export default function AvailabilityPromptDrawer({
    opened,
    onClose,
    game,
    player,
    teamId,
}) {
    const fetcher = useFetcher();
    const [selected, setSelected] = useState(null);

    const isSubmitting = fetcher.state !== "idle";

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data?.success) {
            onClose();
        }
    }, [fetcher.state, fetcher.data, onClose]);

    const handleSubmit = () => {
        if (!selected) return;

        const formData = new FormData();
        formData.append("_action", "update-attendance");
        formData.append("playerId", player.$id);
        formData.append("status", selected);
        formData.append("updatedBy", player.$id);
        formData.append("teamId", teamId);

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
            title="Submit Availability"
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
                                            : "rgba(255, 255, 255, 0.1)",
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
                                                    : "white"
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
