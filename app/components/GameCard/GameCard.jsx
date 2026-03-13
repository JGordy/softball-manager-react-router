import { Link } from "react-router";
import { Badge, Box, Card, Flex, Group, Stack, Text } from "@mantine/core";

import { DateTime } from "luxon";

import { getGameDayStatus } from "@/utils/dateTime";
import { IconBallBaseball, IconRun } from "@tabler/icons-react";

const getGameResultColor = (result) => {
    if (result === "won") return "lime";
    if (result === "lost") return "red";
    return "yellow";
};

const getGameStatus = (
    dateIso,
    result,
    score,
    opponentScore,
    zone,
    eventType,
) => {
    // Use getGameDayStatus for day classification in UTC -> then we can refine with hourly precision
    const dayStatus = getGameDayStatus(dateIso, true);

    if (dayStatus === "past") {
        if (eventType === "practice") {
            return {
                status: "past",
                text: (
                    <Text c="dimmed" size="sm" span>
                        Completed
                    </Text>
                ),
            };
        }

        if (result) {
            const resultsText = `${result.toUpperCase()} ${score}-${opponentScore}`;
            return {
                status: "past",
                text: (
                    <Badge
                        color={getGameResultColor(result)}
                        variant="light"
                        size="sm"
                    >
                        {resultsText}
                    </Badge>
                ),
            };
        }

        return {
            status: "past",
            text: (
                <Text c="dimmed" size="sm" span>
                    Results Pending
                </Text>
            ),
        };
    }

    if (dayStatus === "in progress") {
        return {
            status: "today",
            text: (
                <Text span fw={700} c="lime" size="sm">
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
                        <Text span fw={700} c="lime" size="sm">
                            {hoursUntil === 1
                                ? "1 hr away!"
                                : `${hoursUntil} hrs away!`}
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
                    <Text span fw={700} c="lime" size="sm">
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
    primaryColor,
    eventType = "game",
}) {
    const isPractice = eventType === "practice";
    const formattedHeader = isPractice
        ? "Practice"
        : `${isHomeGame ? "vs" : "@"} ${opponent || "TBD"}`;

    const gameStatus = getGameStatus(
        gameDate,
        result,
        score,
        opponentScore,
        timeZone,
        eventType,
    );

    const shortDate = DateTime.fromISO(gameDate).toFormat("M/d");
    const shortTime = DateTime.fromISO(gameDate, { zone: "utc" })
        .setZone(timeZone || "local")
        .toLocaleString(DateTime.TIME_SIMPLE);

    const brandingColor = primaryColor || (isPractice ? "blue" : "lime");

    return (
        <Link
            key={$id}
            to={`/events/${$id}`}
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <Card className="game-card" mb="md" radius="md" p="xs" withBorder>
                <Flex align="stretch" gap="xs">
                    {/* Left Column: Team Branding & Date Inset */}
                    <Stack
                        bg={brandingColor}
                        align="center"
                        justify="center"
                        gap="2"
                        c="white"
                        p="xs"
                        style={{ borderRadius: "var(--mantine-radius-md)" }}
                    >
                        {isPractice ? (
                            <IconRun size={18} stroke={2.5} />
                        ) : (
                            <IconBallBaseball size={18} stroke={2.5} />
                        )}
                        <Text
                            fw={700}
                            size="md"
                            style={{ whiteSpace: "nowrap" }}
                        >
                            {shortDate}
                        </Text>
                    </Stack>

                    {/* Right Column: Inner Card Details */}
                    <Box style={{ flex: 1 }} p="xs">
                        <Stack gap={4} p="0">
                            <Text fw={700} size="md" lineClamp={1}>
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
                                <Text span fw={500} c="dimmed">
                                    {formattedHeader}
                                </Text>
                            </Text>

                            <Group
                                gap="xs"
                                justify="space-between"
                                align="center"
                            >
                                <Text size="sm" c="dimmed" fw={500}>
                                    {shortTime}
                                </Text>
                                {gameStatus.text}
                            </Group>
                        </Stack>
                    </Box>
                </Flex>
            </Card>
        </Link>
    );
}
