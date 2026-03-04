import { Link } from "react-router";
import {
    Avatar,
    Badge,
    Box,
    Card,
    Group,
    Skeleton,
    Stack,
    Text,
    Tooltip,
} from "@mantine/core";
import { IconUsersGroup } from "@tabler/icons-react";

import DeferredLoader from "@/components/DeferredLoader";
import InlineError from "@/components/InlineError";

import addPlayerAvailability from "@/utils/addPlayerAvailability";

import AvailablityContainer from "./AvailablityContainer";

const STATUS_CONFIG = {
    accepted: { color: "lime", label: "In" },
    declined: { color: "red", label: "Out" },
    unknown: { color: "gray", label: "?" },
};

function PlayerAvailabilityGrid({ players }) {
    return (
        <Box
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
            }}
        >
            {players.map((player) => {
                const status =
                    STATUS_CONFIG[player.availability] ?? STATUS_CONFIG.unknown;
                const initials =
                    `${player.firstName?.[0] ?? ""}${player.lastName?.[0] ?? ""}`.toUpperCase();

                return (
                    <Tooltip
                        key={player.$id}
                        label={`${player.firstName} ${player.lastName} — ${player.availability}`}
                        position="top"
                        withArrow
                    >
                        <Stack align="center" gap={4} style={{ width: "52px" }}>
                            <Avatar
                                size="sm"
                                radius="xl"
                                color={status.color}
                                variant="filled"
                            >
                                {initials || "?"}
                            </Avatar>
                            <Badge
                                size="xs"
                                color={status.color}
                                variant="light"
                                style={{ maxWidth: "52px", overflow: "hidden" }}
                            >
                                {status.label}
                            </Badge>
                        </Stack>
                    </Tooltip>
                );
            })}
        </Box>
    );
}

export default function DesktopRosterPanel({
    deferredData,
    game,
    managerView,
    team,
    user,
}) {
    return (
        <Stack gap="md">
            {/* Quick availability summary with avatar grid */}
            <Card withBorder radius="lg" p="xl">
                <Group justify="space-between" align="center" mb="md">
                    <Group gap="xs">
                        <IconUsersGroup
                            size={18}
                            color="var(--mantine-color-lime-5)"
                        />
                        <Text
                            size="xs"
                            tt="uppercase"
                            fw={600}
                            c="dimmed"
                            ls={1}
                        >
                            Player Availability
                        </Text>
                    </Group>

                    <DeferredLoader
                        resolve={deferredData}
                        fallback={null}
                        errorElement={null}
                    >
                        {({ attendance, players }) => {
                            const withAvailability = addPlayerAvailability(
                                attendance?.rows ?? [],
                                players ?? [],
                            );
                            const available = withAvailability.filter(
                                (p) => p.availability === "accepted",
                            ).length;
                            const declined = withAvailability.filter(
                                (p) => p.availability === "declined",
                            ).length;

                            return (
                                <Group gap="xs">
                                    <Badge
                                        color="lime"
                                        variant="light"
                                        size="sm"
                                    >
                                        {available} in
                                    </Badge>
                                    <Badge
                                        color="red"
                                        variant="light"
                                        size="sm"
                                    >
                                        {declined} out
                                    </Badge>
                                    <Badge
                                        color="gray"
                                        variant="light"
                                        size="sm"
                                    >
                                        {withAvailability.length -
                                            available -
                                            declined}{" "}
                                        no response
                                    </Badge>
                                </Group>
                            );
                        }}
                    </DeferredLoader>
                </Group>

                <DeferredLoader
                    resolve={deferredData}
                    fallback={
                        <Group gap="sm" wrap="wrap">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    height={52}
                                    width={52}
                                    radius="xl"
                                />
                            ))}
                        </Group>
                    }
                    errorElement={
                        <InlineError message="Unable to load availability data" />
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

                        return (
                            <PlayerAvailabilityGrid
                                players={withAvailability}
                            />
                        );
                    }}
                </DeferredLoader>
            </Card>

            {/* Full Attendance RSVP list */}
            <Card withBorder radius="lg" p="xl">
                <Text
                    size="xs"
                    tt="uppercase"
                    fw={600}
                    c="dimmed"
                    ls={1}
                    mb="md"
                >
                    {managerView ? "Manage Attendance" : "Your Attendance"}
                </Text>
                <DeferredLoader
                    resolve={deferredData}
                    fallback={
                        <Stack gap="xs">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} height={48} radius="md" />
                            ))}
                        </Stack>
                    }
                    errorElement={
                        <InlineError message="Unable to load attendance data" />
                    }
                >
                    {({ attendance, players }) => (
                        <AvailablityContainer
                            attendance={attendance}
                            game={game}
                            managerView={managerView}
                            players={players ?? []}
                            team={team}
                        />
                    )}
                </DeferredLoader>
            </Card>
        </Stack>
    );
}
