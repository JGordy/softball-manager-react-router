import { Link } from "react-router";
import { Badge, Card, Group, Text } from "@mantine/core";

import { DateTime } from "luxon";

import { formatGameTime, getGameDayStatus } from "@/utils/dateTime";

const getGameResultColor = (result) => {
    if (result === "won") return "lime";
    if (result === "lost") return "red";
    return "yellow";
};

const getGameStatus = (dateIso, result, score, opponentScore, zone) => {
    // Use getGameDayStatus for day classification in UTC -> then we can refine with hourly precision
    const dayStatus = getGameDayStatus(dateIso, true);

    if (dayStatus === "past") {
        if (result) {
            const resultsText = `${result.toUpperCase()} ${score}-${opponentScore}`;
            return {
                status: "past",
                text: (
                    <Badge color={getGameResultColor(result)} variant="light">
                        {resultsText}
                    </Badge>
                ),
            };
        }

        return {
            status: "past",
            text: (
                <Text align={"right"} c="dimmed" size="sm">
                    Results Pending
                </Text>
            ),
        };
    }

    if (dayStatus === "in progress") {
        return {
            status: "today",
            text: (
                <Text align={"right"} span fw={700} c="lime" size="sm">
                    In progress
                </Text>
            ),
        };
    }

    if (dayStatus === "today" || dayStatus === "future") {
        const dt = DateTime.fromISO(dateIso, { zone: "utc" }).setZone(
            zone || undefined,
        );
        const now = DateTime.local().setZone(zone || undefined);
        const daysUntil = Math.ceil(
            (dt.startOf("day").toMillis() - now.startOf("day").toMillis()) /
                (1000 * 3600 * 24),
        );

        if (daysUntil === 0) {
            // compute hours until
            const hoursUntil = Math.ceil(
                (dt.toMillis() - now.toMillis()) / (1000 * 3600),
            );
            if (hoursUntil > 0) {
                return {
                    status: "today",
                    text: (
                        <Text align={"right"} span fw={700} c="lime" size="sm">
                            {hoursUntil === 1
                                ? "1 hour away!"
                                : `${hoursUntil} hours away!`}
                        </Text>
                    ),
                };
            }
            return { status: "today", text: null };
        }

        if (daysUntil <= 10) {
            return {
                status: "future",
                text: (
                    <Text align={"right"} span fw={700} c="lime" size="sm">
                        {`${daysUntil} day${daysUntil !== 1 ? "s" : ""} away!`}
                    </Text>
                ),
            };
        }

        return { status: "future", text: null };
    }

    return { status: "future", text: null };
};

export default function GameCard({
    $id,
    gameDate,
    teamName,
    displayName,
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
            <Card className="game-card" mb="md" radius="md" py="md" withBorder>
                <Text fw={400} size="md" mb="sm">
                    {displayName && (
                        <Text fw={700} span>
                            {displayName + " "}
                        </Text>
                    )}
                    {teamName && !displayName && (
                        <Text fw={700} span>
                            {teamName + " "}
                        </Text>
                    )}
                    {formattedHeader}
                </Text>
                <Group justify="space-between" align="flex-end">
                    <Text size="sm" c="dimmed">
                        {formattedGameTime}
                    </Text>
                    {gameStatus.text}
                </Group>
            </Card>
        </Link>
    );
}
