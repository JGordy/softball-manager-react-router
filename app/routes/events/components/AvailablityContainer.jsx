import { useOutletContext, useFetcher } from "react-router";
import { DateTime } from "luxon";

import {
    Card,
    Divider,
    Group,
    LoadingOverlay,
    ScrollArea,
    SegmentedControl,
    Stack,
    Text,
} from "@mantine/core";

import {
    IconCircleCheckFilled,
    IconHelpTriangleFilled,
    IconMessageCircleOff,
    IconSquareXFilled,
} from "@tabler/icons-react";

import positions from "@/constants/positions";
import { trackEvent } from "@/utils/analytics";

const availabilityData = {
    accepted: {
        icon: <IconCircleCheckFilled size={24} color="lime" />,
        color: "lime",
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
    teamId,
}) => {
    const fetcher = useFetcher();

    const isSubmitting = fetcher.state !== "idle";
    const optimisticStatus =
        isSubmitting && fetcher.formData
            ? fetcher.formData.get("status")
            : attendance?.status;
    const currentStatus = optimisticStatus || "unknown";

    const renderToggle =
        (managerView || currentUserId === player.$id) && !isGamePast;

    const handleAttendanceChange = (text, playerId) => {
        try {
            const formData = new FormData();
            formData.append("_action", "update-attendance");
            formData.append("playerId", playerId);
            formData.append("status", availabilityData[text].value);
            formData.append("updatedBy", currentUserId);
            formData.append("teamId", teamId);

            fetcher.submit(formData, {
                method: "post",
                action: `/events/${game.$id}`,
            });

            trackEvent("submit-event-attendance", {
                eventId: game.$id,
                submittedBy:
                    currentUserId === player.$id ? "player" : "manager",
            });
        } catch (error) {
            console.error("Error submitting attendance form:", error);
        }
    };

    return (
        <Card key={player.$id} shadow="sm" radius="md" p="sm" pos="relative">
            <LoadingOverlay
                data-overlay={`availability-${player.$id}`}
                visible={isSubmitting}
                overlayProps={{ blur: 2, radius: "md" }}
                loaderProps={{ color: "lime", type: "dots", size: "lg" }}
            />
            <Group justify="space-between" wrap="nowrap">
                <Group
                    gap="xs"
                    wrap="nowrap"
                    style={{ flex: 1, overflow: "hidden", minWidth: 0 }}
                >
                    <Text c="dimmed" size="sm" miw="1.1rem">
                        {positions[player.preferredPositions?.[0]]?.initials ||
                            "-"}
                    </Text>
                    <Divider orientation="vertical" />
                    <Text
                        fw={700}
                        truncate="end"
                        style={{ flex: 1, minWidth: 0 }}
                    >
                        {player.firstName} {player.lastName}
                    </Text>
                </Group>
                {!renderToggle ? (
                    availabilityData[currentStatus].icon
                ) : (
                    <SegmentedControl
                        data={[
                            { label: "Yes", value: "accepted" },
                            { label: "No", value: "declined" },
                            { label: "Maybe", value: "tentative" },
                        ]}
                        value={
                            ["accepted", "declined", "tentative"].includes(
                                currentStatus,
                            )
                                ? currentStatus
                                : ""
                        }
                        onChange={(value) =>
                            handleAttendanceChange(value, player.$id)
                        }
                        color={availabilityData[currentStatus]?.color || "blue"}
                        size="xs"
                        style={{ flexShrink: 0 }}
                    />
                )}
            </Group>
        </Card>
    );
};

export default function AvailabliityContainer({
    attendance,
    game,
    managerView,
    players,
    team,
}) {
    const { user } = useOutletContext();
    const currentUserId = user.$id;

    const { gameDate, timeZone } = game;

    // Convert stored ISO (UTC) into the event timezone for day comparisons
    const gameDt = DateTime.fromISO(gameDate, { zone: "utc" }).setZone(
        timeZone || "local",
    );
    const today = DateTime.local().setZone(timeZone || "local");
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

        // Sort each bucket: current user first, then alphabetically by lastName then firstName
        Object.keys(buckets).forEach((k) => {
            buckets[k].sort((p1, p2) => {
                if (p1.player.$id === currentUserId) return -1;
                if (p2.player.$id === currentUserId) return 1;

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
                                teamId={team?.$id}
                            />
                        ))}
                    </Stack>
                </div>
            );
        });
    };

    return (
        <>
            <ScrollArea.Autosize scrollbars={false} offsetScrollbars>
                {players?.length > 0 && renderGroupedAvailability()}
            </ScrollArea.Autosize>
        </>
    );
}
