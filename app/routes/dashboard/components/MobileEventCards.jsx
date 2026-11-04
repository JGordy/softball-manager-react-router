import { Link } from "react-router";
import { Box, Text, Tooltip } from "@mantine/core";
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
        <Box className={classes.eventCard}>
            {/* Header: Countdown pill and Date & Time Glass Pill */}
            <div className={classes.headerRow}>
                <div
                    className={`${classes.countdownPill} ${isLive ? classes.countdownPillLive : ""}`}
                >
                    {countdownText}
                </div>
                <div className={classes.dateTimePill}>
                    <IconCalendar size={13} stroke={2} />
                    <span>
                        {formattedDate || shortDate} • {shortTime}
                    </span>
                </div>
            </div>

            {/* Matchup row */}
            <div className={classes.matchupRow}>
                <Text className={classes.matchupTitle}>{matchupTitle}</Text>
            </div>

            {/* Attached Action Bar */}
            {!isPractice && (
                <div className={classes.actionBar}>
                    {/* Primary CTA */}
                    {isManager && (
                        <Link
                            to={
                                isLive
                                    ? `/events/${game.$id}/gameday`
                                    : `/events/${game.$id}/lineup`
                            }
                            className={`${classes.primaryPillButton} ${isLive ? classes.primaryPillButtonBlue : ""}`}
                        >
                            {isLive
                                ? "Go Live"
                                : hasLineup
                                  ? "Edit Lineup"
                                  : "Create Lineup"}
                        </Link>
                    )}

                    {!isManager && (
                        <Link
                            to={`/events/${game.$id}`}
                            className={classes.primaryPillButton}
                        >
                            View Details
                        </Link>
                    )}

                    {/* Bubble 1: RSVP Button */}
                    <Tooltip label="RSVP for Game" withArrow>
                        {onRsvpClick ? (
                            <button
                                type="button"
                                onClick={onRsvpClick}
                                className={classes.bubbleButton}
                                aria-label="RSVP"
                            >
                                <IconCheck
                                    size={15}
                                    stroke={3}
                                    style={{ marginRight: 3 }}
                                />
                                <span>RSVP</span>
                            </button>
                        ) : (
                            <Link
                                to={`/events/${game.$id}`}
                                className={classes.bubbleButton}
                                aria-label="RSVP"
                            >
                                <IconCheck
                                    size={15}
                                    stroke={3}
                                    style={{ marginRight: 3 }}
                                />
                                <span>RSVP</span>
                            </Link>
                        )}
                    </Tooltip>

                    {/* Bubble 2: Map Pin Button */}
                    <Tooltip label="Open Venue Map" withArrow>
                        <button
                            type="button"
                            onClick={handleOpenMap}
                            className={classes.bubbleCircleButton}
                            aria-label="Venue location"
                        >
                            <IconMapPin size={17} stroke={2.5} />
                        </button>
                    </Tooltip>
                </div>
            )}
        </Box>
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
    let resultPillClass = classes.resultPillMuted;
    let resultText = "COMPLETED";

    if (game.result === "won") {
        resultPillClass = classes.resultPillWon;
        resultText = `WON ${game.score ?? ""}-${game.opponentScore ?? ""}`;
    } else if (game.result === "lost") {
        resultPillClass = classes.resultPillLost;
        resultText = `LOST ${game.score ?? ""}-${game.opponentScore ?? ""}`;
    } else if (game.result === "tied") {
        resultPillClass = classes.resultPillMuted;
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
        <Box className={classes.eventCard}>
            {/* Header: Date & Time Glass Pill and Result Tag */}
            <div className={classes.headerRow}>
                <div className={classes.dateTimePill}>
                    <IconCalendar size={13} stroke={2} />
                    <span>
                        {formattedDate || shortDate} • {shortTime}
                    </span>
                </div>

                {!isPractice && (
                    <div className={resultPillClass}>{resultText}</div>
                )}
            </div>

            {/* Matchup row */}
            <div className={classes.matchupRow}>
                <Text className={classes.matchupTitle}>{matchupTitle}</Text>
            </div>

            {/* Attached Action Bar */}
            {!isPractice && (
                <div className={classes.actionBar}>
                    {/* Primary CTA: Recap */}
                    <Link
                        to={`/events/${game.$id}/gameday`}
                        className={classes.primaryPillButton}
                    >
                        Recap
                    </Link>

                    {/* Bubble 1: Trophy / Awards button */}
                    <Tooltip label="See Awards" withArrow>
                        <Link
                            to={`/events/${game.$id}?open=awards`}
                            className={classes.bubbleCircleButton}
                            aria-label="See Awards"
                        >
                            <IconTrophy size={17} stroke={2.5} />
                            <span className={classes.srOnly}>See Awards</span>
                        </Link>
                    </Tooltip>

                    {/* Bubble 2: Share button */}
                    <Tooltip label="Share Result" withArrow>
                        <button
                            type="button"
                            onClick={handleShare}
                            className={classes.bubbleCircleButton}
                            aria-label="Share match result"
                        >
                            <IconShare size={17} stroke={2.5} />
                        </button>
                    </Tooltip>
                </div>
            )}
        </Box>
    );
}
