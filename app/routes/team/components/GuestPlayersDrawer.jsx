import { useMemo } from "react";
import { Avatar, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconMailFast, IconUserOff } from "@tabler/icons-react";
import DrawerContainer from "@/components/DrawerContainer";
import useModal from "@/hooks/useModal";
import ConvertGuestModal from "@/forms/ConvertGuestModal";
import { formatForViewerDate } from "@/utils/dateTime";

/**
 * Drawer component displaying all previous guest players who have played for the team.
 * Allows managers to review guest appearances, stats, and convert guests to permanent team members.
 *
 * @param {object} props
 * @param {boolean} props.opened - Whether drawer is visible.
 * @param {Function} props.onClose - Drawer close handler.
 * @param {Array<object>} props.guestPlayers - List of guest player objects.
 * @param {string} props.teamId - ID of the team.
 * @param {string} [props.buttonColor] - Theme button color.
 * @param {boolean} [props.isDesktop] - Whether current screen is desktop.
 */
export default function GuestPlayersDrawer({
    opened,
    onClose,
    guestPlayers = [],
    teamId,
    buttonColor = "lime",
    isDesktop = false,
}) {
    const { openModal } = useModal();

    const sortedGuests = useMemo(() => {
        return [...guestPlayers].sort((a, b) => {
            const timeA = a.recentGame?.date
                ? new Date(a.recentGame.date).getTime()
                : 0;
            const timeB = b.recentGame?.date
                ? new Date(b.recentGame.date).getTime()
                : 0;

            if (timeB !== timeA) {
                return timeB - timeA;
            }

            if ((b.gameCount || 0) !== (a.gameCount || 0)) {
                return (b.gameCount || 0) - (a.gameCount || 0);
            }
            return (a.firstName || "").localeCompare(b.firstName || "");
        });
    }, [guestPlayers]);

    const handleOpenConvertModal = (guest) => {
        onClose();
        openModal({
            title: `Convert ${guest.firstName} ${guest.lastName} to Team Member`,
            children: (
                <ConvertGuestModal
                    guestPlayer={guest}
                    teamId={teamId}
                    actionRoute={`/team/${teamId}`}
                    buttonColor={buttonColor}
                />
            ),
        });
    };

    return (
        <DrawerContainer
            opened={opened}
            onClose={onClose}
            title="Guest Players"
            size={isDesktop ? "md" : "xl"}
        >
            <Stack gap="md" mt="md">
                {guestPlayers.length === 0 ? (
                    <Card withBorder radius="md" p="xl" ta="center">
                        <Stack align="center" gap="sm">
                            <IconUserOff size={36} stroke={1.5} color="gray" />
                            <Text fw={600} size="md">
                                No Guest Players Yet
                            </Text>
                            <Text size="sm" c="dimmed" maw={360}>
                                When you add guest players to game lineups, they
                                will appear here so you can invite them as full
                                team members anytime.
                            </Text>
                        </Stack>
                    </Card>
                ) : (
                    <>
                        <Stack gap="sm">
                            {sortedGuests.map((guest) => {
                                const fullName =
                                    `${guest.firstName} ${guest.lastName}`.trim();
                                // Sanitize name for initials so "(Guest)" doesn't create "(" as an initial
                                const cleanInitialsName = fullName
                                    .replace(/\s*\(guest\)/gi, "")
                                    .trim();
                                const hasStats =
                                    guest.stats && guest.stats.ab > 0;
                                const formattedDate = guest.recentGame?.date
                                    ? formatForViewerDate(guest.recentGame.date)
                                    : null;
                                const lastPlayedDate =
                                    formattedDate &&
                                    formattedDate !== "Invalid Date"
                                        ? formattedDate
                                        : guest.recentGame?.date;

                                return (
                                    <Card
                                        key={guest.$id}
                                        withBorder
                                        radius="md"
                                        p="sm"
                                    >
                                        <Group
                                            justify="space-between"
                                            align="flex-start"
                                            wrap="nowrap"
                                            gap="sm"
                                        >
                                            <Group
                                                gap="sm"
                                                wrap="nowrap"
                                                style={{ minWidth: 0, flex: 1 }}
                                            >
                                                <Avatar
                                                    color="initials"
                                                    name={
                                                        cleanInitialsName ||
                                                        fullName
                                                    }
                                                    radius="xl"
                                                    size="md"
                                                    variant="light"
                                                />
                                                <div
                                                    style={{
                                                        minWidth: 0,
                                                        flex: 1,
                                                    }}
                                                >
                                                    <Group gap="xs" wrap="wrap">
                                                        <Text
                                                            fz="sm"
                                                            fw={600}
                                                            truncate
                                                        >
                                                            {fullName}
                                                        </Text>
                                                        <Badge
                                                            size="xs"
                                                            color="gray"
                                                            variant="light"
                                                        >
                                                            {guest.gender ||
                                                                "Guest"}
                                                        </Badge>
                                                    </Group>

                                                    <Text
                                                        fz="xs"
                                                        c="dimmed"
                                                        mt={2}
                                                    >
                                                        {guest.gameCount}{" "}
                                                        {guest.gameCount === 1
                                                            ? "game"
                                                            : "games"}{" "}
                                                        played
                                                    </Text>
                                                </div>
                                            </Group>

                                            <Button
                                                size="xs"
                                                variant="filled"
                                                color={buttonColor || "lime"}
                                                autoContrast
                                                leftSection={
                                                    <IconMailFast size={14} />
                                                }
                                                onClick={() =>
                                                    handleOpenConvertModal(
                                                        guest,
                                                    )
                                                }
                                                style={{ flexShrink: 0 }}
                                            >
                                                Convert
                                            </Button>
                                        </Group>

                                        {(hasStats || guest.recentGame) && (
                                            <Group
                                                gap="xs"
                                                wrap="wrap"
                                                mt="xs"
                                                pt="xs"
                                                style={{
                                                    borderTop:
                                                        "1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))",
                                                }}
                                            >
                                                {hasStats && (
                                                    <Badge
                                                        variant="light"
                                                        color="gray"
                                                        size="sm"
                                                    >
                                                        {guest.stats.hits}/
                                                        {guest.stats.ab} (
                                                        {guest.stats.avg} AVG)
                                                    </Badge>
                                                )}
                                                {lastPlayedDate && (
                                                    <Text fz="xs" c="dimmed">
                                                        Last played{" "}
                                                        {lastPlayedDate}
                                                    </Text>
                                                )}
                                            </Group>
                                        )}
                                    </Card>
                                );
                            })}
                        </Stack>
                        <Text size="xs" c="dimmed" ta="center" mt="xs">
                            Converting sends an email invitation and permanently
                            attributes all previous game logs, box scores, and
                            stats to their new account.
                        </Text>
                    </>
                )}
            </Stack>
        </DrawerContainer>
    );
}
