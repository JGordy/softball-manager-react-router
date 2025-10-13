import { Link } from "react-router";
import { Card, Group, Text } from "@mantine/core";

import { DateTime } from "luxon";

import { formatGameTime, getGameDayStatus } from "@/utils/dateTime";

const getGameResultColor = (result) => {
    if (result === "won") return "green";
    if (result === "lost") return "red";
    return "yellow";
};

const getGameStatus = (dateIso, result, score, opponentScore, zone) => {
    // Use getGameDayStatus for day classification in UTC -> then we can refine with hourly precision
    const dayStatus = getGameDayStatus(dateIso, true);

    if (dayStatus === "past") {
        const resultsText = result
            ? `${result.charAt(0).toUpperCase()} ${score} - ${opponentScore}`
            : "Results Pending";

        return {
            status: "past",
            text: (
                <Text align={"right"} c={getGameResultColor(result)}>
                    {resultsText}
                </Text>
            ),
        };
    }

    if (dayStatus === "in progress") {
        return {
            status: "today",
            text: (
                <Text align={"right"} span fw={700} c="green">
                    In progress
                </Text>
            ),
        };
    }

    if (dayStatus === "today") {
        // compute hours until using Luxon via formatForViewerTime usage for display
        const dt = DateTime.fromISO(dateIso, { zone: "utc" }).setZone(
            zone || undefined,
        );
        const now = DateTime.local().setZone(zone || undefined);
        const hoursUntil = Math.ceil(
            (dt.toMillis() - now.toMillis()) / (1000 * 3600),
        );
        if (hoursUntil > 0) {
            return {
                status: "today",
                text: (
                    <Text align={"right"} span fw={700} c="green">
                        {hoursUntil === 1
                            ? "1 hour away!"
                            : `${hoursUntil} hours away!`}
                    </Text>
                ),
            };
        }
        return { status: "today", text: null };
    }

    // future: determine days until
    if (dayStatus === "future") {
        const dt = DateTime.fromISO(dateIso, { zone: "utc" }).setZone(
            zone || undefined,
        );
        const now = DateTime.local().setZone(zone || undefined);
        const daysUntil = Math.ceil(
            (dt.startOf("day").toMillis() - now.startOf("day").toMillis()) /
                (1000 * 3600 * 24),
        );
        return {
            status: "future",
            text: (
                <Text align={"right"} span fw={700} c="green">
                    {`${daysUntil} day${daysUntil !== 1 ? "s" : ""} away!`}
                </Text>
            ),
        };
    }

    return { status: "future", text: null };
};

export default function GameCard({
    $id,
    gameDate,
    teamName,
    isHomeGame,
    result,
    score,
    opponent,
    opponentScore,
    timeZone,
}) {
    const formattedHeader = `${isHomeGame ? "vs" : "@"} ${opponent || "TBD"}`;

    const gameStatus = getGameStatus(gameDate, result, score, opponentScore);

    const formattedGameTime = formatGameTime(gameDate, timeZone);

    return (
        <Link key={$id} to={`/events/${$id}`}>
            <Card className="game-card" mb="md" radius="md" py="lg" withBorder>
                <Text fw={400} size="lg" mb="md">
                    {teamName && (
                        <Text fw={700} span>
                            {teamName + " "}
                        </Text>
                    )}
                    {formattedHeader}
                </Text>
                <Group justify="space-between">
                    <Text>{formattedGameTime}</Text>
                    {gameStatus.text}
                </Group>
            </Card>
        </Link>
    );
}
