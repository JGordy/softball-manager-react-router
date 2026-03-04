import { useOutletContext, useFetcher } from "react-router";
import { DateTime } from "luxon";

import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Group,
    LoadingOverlay,
    Stack,
    Text,
} from "@mantine/core";
import { IconUsersGroup } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";

import positions from "@/constants/positions";
import { trackEvent } from "@/utils/analytics";
import addPlayerAvailability from "@/utils/addPlayerAvailability";

// ── Status config ────────────────────────────────────────────────────────────
const STATUS = {
    accepted: { label: "Yes", color: "lime", value: "accepted" },
    declined: { label: "No", color: "red", value: "declined" },
    tentative: { label: "Maybe", color: "orange", value: "tentative" },
    unknown: { label: "Unknown", color: "gray", value: "unknown" },
};

// ── Single player row ────────────────────────────────────────────────────────
function AttendanceRow({
    player,
    attendance,
    game,
    teamId,
    currentUserId,
    managerView,
    isGamePast,
}) {
    const fetcher = useFetcher();
    const status = attendance?.status || "unknown";
    const current = STATUS[status] ?? STATUS.unknown;
    const canEdit =
        !isGamePast && (managerView || currentUserId === player.$id);

    const initials =
        `${player.firstName?.[0] ?? ""}${player.lastName?.[0] ?? ""}`.toUpperCase();
    const position = positions[player.preferredPositions?.[0]]?.initials || "–";

    const submit = (value) => {
        const formData = new FormData();
        formData.append("_action", "update-attendance");
        formData.append("playerId", player.$id);
        formData.append("status", STATUS[value].value);
        formData.append("updatedBy", currentUserId);
        formData.append("teamId", teamId);

        fetcher.submit(formData, {
            method: "post",
            action: `/events/${game.$id}`,
        });

        trackEvent("submit-event-attendance", {
            eventId: game.$id,
            submittedBy: currentUserId === player.$id ? "player" : "manager",
        });
    };

    const isLoading = fetcher.state !== "idle";

    return (
        <Box
            pos="relative"
            py="xs"
            px="sm"
            style={{
                borderRadius: "var(--mantine-radius-md)",
                borderBottom: "1px solid var(--mantine-color-default-border)",
            }}
        >
            <LoadingOverlay
                visible={isLoading}
                overlayProps={{ blur: 2, radius: "md" }}
                loaderProps={{ color: "lime", type: "dots", size: "sm" }}
            />
            <Group justify="space-between" align="center" wrap="nowrap">
                {/* Left: avatar + position + name */}
                <Group gap="sm" wrap="nowrap">
                    <Avatar
                        size="sm"
                        radius="xl"
                        color={current.color}
                        variant="filled"
                    >
                        {initials || "?"}
                    </Avatar>
                    <Text size="xs" c="dimmed" miw="1.5rem" ta="center">
                        {position}
                    </Text>
                    <Text size="sm" fw={600}>
                        {player.firstName} {player.lastName}
                    </Text>
                </Group>

                {/* Right: status controls or read-only badge */}
                {canEdit ? (
                    <Group gap={6} wrap="nowrap">
                        {["accepted", "declined", "tentative"].map((key) => {
                            const s = STATUS[key];
                            const isActive = status === key;
                            return (
                                <Button
                                    key={key}
                                    size="compact-xs"
                                    variant={isActive ? "filled" : "subtle"}
                                    color={s.color}
                                    onClick={() => !isActive && submit(key)}
                                    style={{ minWidth: 52 }}
                                >
                                    {s.label}
                                </Button>
                            );
                        })}
                    </Group>
                ) : (
                    <Badge size="sm" color={current.color} variant="light">
                        {current.label}
                    </Badge>
                )}
            </Group>
        </Box>
    );
}

// ── Status summary bar ───────────────────────────────────────────────────────
function StatusSummary({ players }) {
    const counts = { accepted: 0, declined: 0, tentative: 0, unknown: 0 };
    players.forEach((p) => {
        counts[p.availability] = (counts[p.availability] ?? 0) + 1;
    });

    return (
        <Group gap="xs" mb="md">
            {Object.entries(counts).map(([key, n]) => {
                if (n === 0) return null;
                const s = STATUS[key];
                return (
                    <Badge key={key} color={s.color} variant="light" size="sm">
                        {n} {s.label}
                    </Badge>
                );
            })}
        </Group>
    );
}

// ── Main exported component ──────────────────────────────────────────────────
export default function DesktopAttendancePanel({
    deferredData,
    game,
    managerView,
    team,
}) {
    const { user } = useOutletContext();
    const currentUserId = user?.$id;

    const { gameDate, timeZone } = game;
    const gameDt = DateTime.fromISO(gameDate, { zone: "utc" }).setZone(
        timeZone || DateTime.local().zoneName,
    );
    const today = DateTime.local().setZone(
        timeZone || DateTime.local().zoneName,
    );
    const isGameToday = gameDt.toISODate() === today.toISODate();
    const isGamePast = gameDt < today && !isGameToday;

    return (
        <Card
            withBorder
            radius="lg"
            p="xl"
            data-testid="desktop-attendance-panel"
        >
            <Group gap="xs" mb="md">
                <IconUsersGroup size={18} color="var(--mantine-color-lime-5)" />
                <Text size="xs" tt="uppercase" fw={600} c="dimmed" ls={1}>
                    {managerView ? "Manage Attendance" : "Your Attendance"}
                </Text>
            </Group>

            <DeferredLoader
                resolve={deferredData}
                fallback={
                    <Stack gap="xs">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Box
                                key={i}
                                h={40}
                                style={{
                                    borderRadius: "var(--mantine-radius-md)",
                                    background:
                                        "var(--mantine-color-default-border)",
                                    opacity: 0.4,
                                }}
                            />
                        ))}
                    </Stack>
                }
                errorElement={
                    <InlineError message="Unable to load attendance data" />
                }
            >
                {({ attendance, players }) => {
                    const withAvailability = addPlayerAvailability(
                        attendance?.rows ?? [],
                        players ?? [],
                    );

                    if (!withAvailability.length) {
                        return (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                                No players on roster yet
                            </Text>
                        );
                    }

                    const byPlayer = new Map(
                        (attendance?.rows ?? []).map((a) => [a.playerId, a]),
                    );

                    return (
                        <>
                            <StatusSummary players={withAvailability} />
                            <Stack gap={2}>
                                {withAvailability.map((player) => (
                                    <AttendanceRow
                                        key={player.$id}
                                        player={player}
                                        attendance={byPlayer.get(player.$id)}
                                        game={game}
                                        teamId={team?.$id}
                                        currentUserId={currentUserId}
                                        managerView={managerView}
                                        isGamePast={isGamePast}
                                    />
                                ))}
                            </Stack>
                        </>
                    );
                }}
            </DeferredLoader>
        </Card>
    );
}
