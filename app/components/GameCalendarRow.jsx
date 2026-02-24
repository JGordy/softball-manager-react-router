import { useRef, useEffect } from "react";
import { Box, Card, Group, Stack, Text } from "@mantine/core";
import { DateTime } from "luxon";

import classes from "@/styles/gameCalendarRow.module.css";

const RESULT_CONFIG = {
    won: { label: "W" },
    lost: { label: "L" },
    tie: { label: "T" },
};

export default function GameCalendarRow({ games = [] }) {
    const today = DateTime.local().startOf("day");
    const containerRef = useRef(null);
    const itemRefs = useRef({});

    // 1. Group games by date and only show dates that HAVE games
    const gamesByDate = games.reduce((acc, game) => {
        const gameDate = DateTime.fromISO(game.gameDate, { zone: "utc" })
            .setZone(DateTime.local().zoneName)
            .startOf("day");
        const dateKey = gameDate.toISODate();

        if (!acc[dateKey]) {
            acc[dateKey] = {
                date: gameDate,
                games: [],
            };
        }
        acc[dateKey].games.push(game);
        return acc;
    }, {});

    // 2. Sort dates chronologically
    const sortedDates = Object.values(gamesByDate).sort(
        (a, b) => a.date - b.date,
    );

    // 3. Find "closest" date to today to scroll to
    const closestDateKey = (() => {
        const todayKey = today.toISODate();
        if (gamesByDate[todayKey]) return todayKey;
        const firstFuture = sortedDates.find((d) => d.date > today);
        if (firstFuture) return firstFuture.date.toISODate();
        if (sortedDates.length > 0)
            return sortedDates[sortedDates.length - 1].date.toISODate();
        return null;
    })();

    useEffect(() => {
        if (closestDateKey && itemRefs.current[closestDateKey]) {
            itemRefs.current[closestDateKey].scrollIntoView({
                behavior: "auto",
                block: "nearest",
                inline: "center",
            });
        }
    }, [closestDateKey, games]);

    if (sortedDates.length === 0) return null;

    return (
        <Box mt="md" mb="xl">
            <Group
                ref={containerRef}
                wrap="nowrap"
                gap="xs"
                className={classes.container}
            >
                {sortedDates.map(({ date, games: gamesOnDay }) => {
                    const isToday = date.hasSame(today, "day");
                    const dateStr = date.toISODate();

                    return (
                        <Card
                            key={dateStr}
                            ref={(el) => (itemRefs.current[dateStr] = el)}
                            radius="lg"
                            py="md"
                            px="sm"
                            withBorder
                            className={`${classes.card} ${isToday ? classes.cardActive : ""}`}
                        >
                            <Stack gap="xs" align="center">
                                <Group gap={4} h={10} justify="center" mb="2px">
                                    {gamesOnDay.map((game, idx) => {
                                        const config =
                                            RESULT_CONFIG[game.result];
                                        if (config) {
                                            const resultClass =
                                                classes[
                                                    `status${game.result.charAt(0).toUpperCase() + game.result.slice(1)}`
                                                ];

                                            return (
                                                <Text
                                                    key={game.$id || idx}
                                                    className={`${classes.statusText} ${resultClass || ""} ${isToday ? classes.statusIndicatorActive : ""}`}
                                                >
                                                    {config.label}
                                                </Text>
                                            );
                                        }
                                        return (
                                            <Box
                                                key={game.$id || idx}
                                                className={`${classes.statusDot} ${isToday ? classes.statusDotActive : ""}`}
                                            />
                                        );
                                    })}
                                </Group>

                                <Text
                                    className={`${classes.weekday} ${isToday ? classes.weekdayActive : ""}`}
                                    fw={isToday ? 700 : 500}
                                >
                                    {date.toFormat("ccc")}
                                </Text>
                                <Text
                                    className={`${classes.dateText} ${isToday ? classes.dateTextActive : ""}`}
                                    fw={800}
                                >
                                    {date.toFormat("M/d")}
                                </Text>
                            </Stack>
                        </Card>
                    );
                })}
            </Group>
        </Box>
    );
}
