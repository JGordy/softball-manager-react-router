import { Link } from "react-router";
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Group,
    Text,
    Tooltip,
    VisuallyHidden,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
    IconCalendar,
    IconCheck,
    IconMapPin,
    IconTrophy,
    IconShare,
} from "@tabler/icons-react";
import { DateTime } from "luxon";

import { getGameDayStatus } from "@/utils/dateTime";
import classes from "./MobileEventCards.module.css";

/**
 * Format game date and time safely with timezone support.
 * @param {string} dateIso - ISO date string
 * @param {string} [zone] - Optional timezone
 * @returns {{ shortDate: string, formattedDate: string, shortTime: string, daysUntil: number, isLive: boolean }}
 */
function parseGameDateTime(dateIso, zone) {
    const dt = DateTime.fromISO(dateIso, { zone: "utc" }).setZone(
        zone || undefined,
    );
    const now = DateTime.local().setZone(zone || undefined);

    const daysUntil = Math.ceil(
        (dt.startOf("day").toMillis() - now.startOf("day").toMillis()) /
            (1000 * 3600 * 24),
    );

    const dayStatus = getGameDayStatus(dateIso, true);
    const isLive = dayStatus === "in progress";

    return {
        shortDate: dt.isValid ? dt.toFormat("M/d") : "",
        formattedDate: dt.isValid ? dt.toFormat("EEE, MMM d") : "",
        shortTime: dt.isValid ? dt.toLocaleString(DateTime.TIME_SIMPLE) : "",
        daysUntil,
        isLive,
    };
}

/**
 * UpcomingEventCard - Mobile upcoming game card with attached lime pill and circular action bubbles.
 *
 * @param {Object} props
 * @param {Object} props.game - Upcoming game object
 * @param {Object} [props.activeTeam] - Current team
 * @param {() => void} [props.onRsvpClick] - Optional callback to open RSVP drawer
 * @returns {JSX.Element}
 */
export function UpcomingEventCard({ game, activeTeam, onRsvpClick }) {
    if (!game) return null;

    const { shortDate, formattedDate, shortTime, daysUntil, isLive } =
        parseGameDateTime(game.gameDate, game.timeZone);

    const isPractice = game.eventType === "practice";
    const opponentName = game.opponent || "Opponent";
    const teamName = game.teamName || activeTeam?.name || "Sliders";
    const matchupTitle = isPractice
        ? `${teamName} Practice`
        : `${teamName} ${game.isHomeGame ? "vs" : "@"} ${opponentName}`;

    // Compute countdown text
    let countdownText = `${daysUntil} DAYS AWAY!`;
    if (isLive) {
        countdownText = "IN PROGRESS";
    } else if (daysUntil === 0) {
        countdownText = "TODAY!";
    } else if (daysUntil === 1) {
        countdownText = "1 DAY AWAY!";
    }

    const hasLineup = !!game.hasLineup;
    const isManager = !!activeTeam?.isManager;

    const handleOpenMap = (e) => {
        e.preventDefault();
        const query = game.location || "softball field";
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
            "_blank",
            "noopener,noreferrer",
        );
    };

    return (
        <Card
            radius={28}
            p="lg"
            pb={32}
            mb={28}
            withBorder
            className={classes.eventCard}
            style={{ overflow: "visible" }}
        >
            {/* Header: Countdown pill and Date & Time Glass Pill */}
            <Group justify="space-between" align="center">
                <Badge
                    variant={isLive ? "light" : "default"}
                    color={isLive ? "lime" : undefined}
                    radius="xl"
                    size="md"
                    fw={800}
                    tt="uppercase"
                >
                    {countdownText}
                </Badge>
                <Badge
                    variant="default"
                    radius="xl"
                    size="md"
                    fw={700}
                    leftSection={<IconCalendar size={13} stroke={2} />}
                >
                    {formattedDate || shortDate} • {shortTime}
                </Badge>
            </Group>

            {/* Matchup row */}
            <Box mt={4} mb={6}>
                <Text fw={700} size="md" lineClamp={1}>
                    {matchupTitle}
                </Text>
            </Box>

            {/* Attached Action Bar */}
            {!isPractice && (
                <Group
                    pos="absolute"
                    bottom={-18}
                    right={16}
                    gap={8}
                    style={{ zIndex: 10 }}
                >
                    {/* Primary CTA */}
                    {isManager && (
                        <Button
                            component={Link}
                            to={
                                isLive
                                    ? `/events/${game.$id}/gameday`
                                    : `/events/${game.$id}/lineup`
                            }
                            color={isLive ? "blue" : "lime"}
                            radius="xl"
                            size="xs"
                            fw={900}
                            tt="uppercase"
                            className={classes.actionPill}
                        >
                            {isLive
                                ? "Go Live"
                                : hasLineup
                                  ? "Edit Lineup"
                                  : "Create Lineup"}
                        </Button>
                    )}

                    {!isManager && (
                        <Button
                            component={Link}
                            to={`/events/${game.$id}`}
                            color="lime"
                            radius="xl"
                            size="xs"
                            fw={900}
                            className={classes.actionPill}
                        >
                            View Details
                        </Button>
                    )}

                    {/* Bubble 1: RSVP Button */}
                    <Tooltip label="RSVP for Game" withArrow>
                        {onRsvpClick ? (
                            <Button
                                component="button"
                                type="button"
                                onClick={onRsvpClick}
                                color="lime"
                                radius="xl"
                                size="xs"
                                fw={900}
                                leftSection={
                                    <IconCheck
                                        size={15}
                                        stroke={3}
                                        style={{ marginRight: 2 }}
                                    />
                                }
                                className={classes.actionPill}
                                aria-label="RSVP"
                            >
                                RSVP
                            </Button>
                        ) : (
                            <Button
                                component={Link}
                                to={`/events/${game.$id}`}
                                color="lime"
                                radius="xl"
                                size="xs"
                                fw={900}
                                leftSection={
                                    <IconCheck
                                        size={15}
                                        stroke={3}
                                        style={{ marginRight: 2 }}
                                    />
                                }
                                className={classes.actionPill}
                                aria-label="RSVP"
                            >
                                RSVP
                            </Button>
                        )}
                    </Tooltip>

                    {/* Bubble 2: Map Pin Button */}
                    <Tooltip label="Open Venue Map" withArrow>
                        <ActionIcon
                            type="button"
                            onClick={handleOpenMap}
                            color="lime"
                            radius="xl"
                            size={36}
                            className={classes.actionCircle}
                            aria-label="Venue location"
                        >
                            <IconMapPin size={17} stroke={2.5} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            )}
        </Card>
    );
}

/**
 * MostRecentGameCard - Mobile past game card with attached Recap pill and Awards/Share bubbles.
 *
 * @param {Object} props
 * @param {Object} props.game - Most recent game object
 * @param {Object} [props.activeTeam] - Current team
 * @returns {JSX.Element}
 */
export function MostRecentGameCard({ game, activeTeam }) {
    if (!game) return null;

    const { shortDate, formattedDate, shortTime } = parseGameDateTime(
        game.gameDate,
        game.timeZone,
    );

    const isPractice = game.eventType === "practice";
    const opponentName = game.opponent || "Opponent";
    const teamName = game.teamName || activeTeam?.name || "Sliders";
    const vsPrefix = game.isHomeGame ? "vs" : "@";
    const matchupTitle = isPractice
        ? `${teamName} Practice`
        : `${teamName} ${vsPrefix} ${opponentName}`;

    // Game result tag
    let resultColor = "gray";
    let resultText = "COMPLETED";

    if (game.result === "won") {
        resultColor = "lime";
        resultText = `WON ${game.score ?? ""}-${game.opponentScore ?? ""}`;
    } else if (game.result === "lost") {
        resultColor = "red";
        resultText = `LOST ${game.score ?? ""}-${game.opponentScore ?? ""}`;
    } else if (game.result === "tied") {
        resultColor = "gray";
        resultText = `TIED ${game.score ?? ""}-${game.opponentScore ?? ""}`;
    }

    const handleShare = (e) => {
        e.preventDefault();
        const shareUrl = `${window.location.origin}/events/${game.$id}`;
        if (navigator.share) {
            navigator
                .share({
                    title: matchupTitle,
                    text: `Game Result: ${resultText} - ${matchupTitle}`,
                    url: shareUrl,
                })
                .catch(() => {});
        } else {
            navigator.clipboard.writeText(shareUrl);
            notifications.show({
                title: "Result Copied",
                message: "Match result link copied to clipboard!",
                color: "lime",
            });
        }
    };

    return (
        <Card
            radius={28}
            p="lg"
            pb={32}
            mb={28}
            withBorder
            className={classes.eventCard}
            style={{ overflow: "visible" }}
        >
            {/* Header: Date & Time Glass Pill and Result Tag */}
            <Group justify="space-between" align="center">
                <Badge
                    variant="default"
                    radius="xl"
                    size="md"
                    fw={700}
                    leftSection={<IconCalendar size={13} stroke={2} />}
                >
                    {formattedDate || shortDate} • {shortTime}
                </Badge>

                {!isPractice && (
                    <Badge
                        variant="light"
                        color={resultColor}
                        radius="xl"
                        size="md"
                        fw={800}
                        tt="uppercase"
                    >
                        {resultText}
                    </Badge>
                )}
            </Group>

            {/* Matchup row */}
            <Box mt={4} mb={6}>
                <Text fw={700} size="md" lineClamp={1}>
                    {matchupTitle}
                </Text>
            </Box>

            {/* Attached Action Bar */}
            {!isPractice && (
                <Group
                    pos="absolute"
                    bottom={-18}
                    right={16}
                    gap={8}
                    style={{ zIndex: 10 }}
                >
                    {/* Primary CTA: Recap */}
                    <Button
                        component={Link}
                        to={`/events/${game.$id}/gameday`}
                        color="lime"
                        radius="xl"
                        size="xs"
                        fw={900}
                        className={classes.actionPill}
                    >
                        Recap
                    </Button>

                    {/* Bubble 1: Trophy / Awards button */}
                    <Tooltip label="See Awards" withArrow>
                        <ActionIcon
                            component={Link}
                            to={`/events/${game.$id}?open=awards`}
                            color="lime"
                            radius="xl"
                            size={36}
                            className={classes.actionCircle}
                            aria-label="See Awards"
                        >
                            <IconTrophy size={17} stroke={2.5} />
                            <VisuallyHidden>See Awards</VisuallyHidden>
                        </ActionIcon>
                    </Tooltip>

                    {/* Bubble 2: Share button */}
                    <Tooltip label="Share Result" withArrow>
                        <ActionIcon
                            type="button"
                            onClick={handleShare}
                            color="lime"
                            radius="xl"
                            size={36}
                            className={classes.actionCircle}
                            aria-label="Share match result"
                        >
                            <IconShare size={17} stroke={2.5} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            )}
        </Card>
    );
}
