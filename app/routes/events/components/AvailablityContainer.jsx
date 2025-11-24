import { useEffect } from "react";
import { useOutletContext, useFetcher } from "react-router";

import {
    ActionIcon,
    Card,
    Collapse,
    Divider,
    Group,
    LoadingOverlay,
    Radio,
    ScrollArea,
    Stack,
    Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import {
    IconChevronDown,
    IconCircleCheckFilled,
    IconHelpTriangleFilled,
    IconMessageCircleOff,
    IconSquareXFilled,
} from "@tabler/icons-react";

import positions from "@/constants/positions";
import { DateTime } from "luxon";

const availabilityData = {
    accepted: {
        icon: <IconCircleCheckFilled size={24} color="green" />,
        color: "green",
        label: "Yes",
        value: "accepted",
    },
    declined: {
        icon: <IconSquareXFilled size={24} color="red" />,
        color: "red",
        label: "No",
        value: "declined",
    },
    tentative: {
        icon: <IconHelpTriangleFilled size={24} color="orange" />,
        color: "orange",
        label: "Maybe",
        value: "tentative",
    },
    unknown: {
        icon: <IconMessageCircleOff size={24} color="gray" />,
        label: "Unknown",
        value: "unknown",
    },
};

const AvailabilityOptionsContainer = ({
    attendance,
    game,
    player,
    managerView,
    currentUserId,
    isGamePast,
}) => {
    const fetcher = useFetcher();
    const [opened, { close, toggle }] = useDisclosure(false);

    const renderToggle =
        (managerView || currentUserId === player.$id) && !isGamePast;

    // This effect will close the collapse after a successful submission.
    useEffect(() => {
        // Check for a successful action response from the fetcher
        if (fetcher.state === "idle" && fetcher.data?.success) {
            close();
        }
    }, [fetcher.state, fetcher.data, close]);

    const handleAttendanceChange = (text, playerId) => {
        try {
            const formData = new FormData();
            formData.append("_action", "update-attendance");
            formData.append("playerId", playerId);
            formData.append("status", availabilityData[text].value);
            formData.append("updatedBy", currentUserId);

            fetcher.submit(formData, {
                method: "post",
                action: `/events/${game.$id}`,
            });
        } catch (error) {
            console.error("Error submitting attendance form:", error);
        }
    };

    return (
        <Card key={player.$id} shadow="sm" radius="md" p="sm" pos="relative">
            <LoadingOverlay
                data-overlay={`availability-${player.$id}`}
                visible={fetcher.state === "loading"}
                overlayProps={{ blur: 2, radius: "md" }}
                loaderProps={{ color: "green", type: "dots", size: "lg" }}
            />
            <Group justify="space-between">
                <Group gap="xs" justify="space-between">
                    <Text c="dimmed" size="sm" miw="1.1rem">
                        {positions[player.preferredPositions?.[0]].initials}
                    </Text>
                    <Divider orientation="vertical" />
                    <Text fw={700}>
                        {player.firstName} {player.lastName}
                    </Text>
                </Group>
                <Group>
                    {availabilityData[attendance?.status || "unknown"].icon}
                    {renderToggle && (
                        <>
                            <Divider orientation="vertical" />
                            <ActionIcon variant="transparent" onClick={toggle}>
                                <IconChevronDown
                                    style={{ width: "70%", height: "70%" }}
                                    stroke={1.5}
                                />
                            </ActionIcon>
                        </>
                    )}
                </Group>
            </Group>

            <Collapse in={opened}>
                <Radio.Group
                    onChange={(value) =>
                        handleAttendanceChange(value, player.$id)
                    }
                    name="status"
                    mt="sm"
                    label="Will you be attending the game?"
                    // description={`Last updated ${attendance?.$updatedAt}`}
                    defaultValue={attendance?.status || "unknown"}
                >
                    <Group justify="space-between" mt="sm">
                        {Object.keys(availabilityData).map((key) => {
                            const item = availabilityData[key];
                            return (
                                key !== "unknown" && (
                                    <Radio.Card
                                        radius="xl"
                                        value={key}
                                        key={`${key}-${player.$id}`}
                                        maw="30%"
                                        py="5px"
                                        style={{ borderColor: item.color }}
                                    >
                                        <Group
                                            wrap="nowrap"
                                            align="center"
                                            justify="center"
                                            gap="5px"
                                        >
                                            <Text>{item.label}</Text>
                                        </Group>
                                    </Radio.Card>
                                )
                            );
                        })}
                    </Group>
                </Radio.Group>
            </Collapse>
        </Card>
    );
};

export default function AvailabliityContainer({
    attendance,
    game,
    managerView,
    players,
}) {
    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const { gameDate, timeZone } = game;

    // Convert stored ISO (UTC) into the event timezone for day comparisons
    const gameDt = DateTime.fromISO(gameDate, { zone: "utc" }).setZone(
        timeZone || DateTime.local().zoneName,
    );
    const today = DateTime.local().setZone(
        timeZone || DateTime.local().zoneName,
    );
    const isGameToday = gameDt.toISODate() === today.toISODate();
    const isGamePast = gameDt < today && !isGameToday;

    // Group players by attendance status (accepted, declined, tentative, unknown)
    const renderGroupedAvailability = () => {
        const byPlayer = new Map(
            (attendance?.rows || []).map((a) => [a.playerId, a]),
        );

        // Initialize buckets in the desired order
        const buckets = {
            accepted: [],
            declined: [],
            tentative: [],
            unknown: [],
        };

        players.forEach((player) => {
            const a = byPlayer.get(player.$id);
            const status = a?.status || "unknown";
            buckets[status] = buckets[status] || [];
            buckets[status].push({ player, attendance: a });
        });

        // Optional: sort each bucket alphabetically by lastName then firstName
        Object.keys(buckets).forEach((k) => {
            buckets[k].sort((p1, p2) => {
                const a = p1.player.lastName?.localeCompare(
                    p2.player.lastName || "",
                );
                if (a !== 0) return a;
                return (p1.player.firstName || "").localeCompare(
                    p2.player.firstName || "",
                );
            });
        });

        return Object.keys(availabilityData).map((key) => {
            const bucket = buckets[key] || [];

            // Hide the entire section if there are no players in this bucket
            if (bucket.length === 0) return null;

            return (
                <div key={key} style={{ marginBottom: 20 }}>
                    <Group align="center" gap="xs" mb="xs">
                        {availabilityData[key].icon}
                        <Text fw={700} c="dimmed">
                            {`${bucket.length} `}
                            {(() => {
                                const v = availabilityData[key].value || "";
                                return v
                                    ? v.charAt(0).toUpperCase() + v.slice(1)
                                    : v;
                            })()}
                        </Text>
                    </Group>

                    <Stack gap="xs">
                        {bucket.map(({ player, attendance: att }) => (
                            <AvailabilityOptionsContainer
                                key={player.$id}
                                attendance={att}
                                currentUserId={currentUserId}
                                game={game}
                                isGamePast={isGamePast}
                                managerView={managerView}
                                player={player}
                            />
                        ))}
                    </Stack>
                </div>
            );
        });
    };

    return (
        <>
            <Card radius="lg" mb="lg">
                <Group justify="space-between" wrap="nowrap">
                    {Object.keys(availabilityData).map((key) => (
                        <Stack align="center" gap="2px" key={key}>
                            {availabilityData[key].icon}
                            <Text size="sm">{availabilityData[key].label}</Text>
                        </Stack>
                    ))}
                </Group>
            </Card>

            <ScrollArea.Autosize scrollbars={false} offsetScrollbars>
                {players?.length > 0 && renderGroupedAvailability()}
            </ScrollArea.Autosize>
        </>
    );
}
