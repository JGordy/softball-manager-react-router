import { useEffect, useState } from "react";
import { Card, Center, ScrollArea, Text, Stack } from "@mantine/core";

import GameCard from "@/components/GameCard";
import { DateTime } from "luxon";

export default function GamesList({
    games,
    primaryColor,
    height = null,
    sortOrder = "asc",
}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!games.length) {
        return (
            <Card padding="lg" radius="md" mt="md">
                <Center>
                    <Text>No games currently listed.</Text>
                </Center>
            </Card>
        );
    }

    const today = isMounted ? DateTime.local() : null;

    const sortedGames = [...games].sort((a, b) => {
        const zoneA = a.timeZone || today?.zoneName || "UTC";
        const zoneB = b.timeZone || today?.zoneName || "UTC";

        const dateA = DateTime.fromISO(a.gameDate, { zone: "utc" }).setZone(
            zoneA,
        );
        const dateB = DateTime.fromISO(b.gameDate, { zone: "utc" }).setZone(
            zoneB,
        );

        if (today) {
            const isPastA = dateA.startOf("day") < today.startOf("day");
            const isPastB = dateB.startOf("day") < today.startOf("day");

            if (isPastA && !isPastB) return 1;
            if (!isPastA && isPastB) return -1;

            // If both are past, sort descending (most recent first)
            if (isPastA && isPastB) {
                return dateB - dateA;
            }
        }

        // Both are future (or pre-mount deterministic order), sort by sortOrder
        if (sortOrder === "dsc") return dateB.toMillis() - dateA.toMillis();
        return dateA.toMillis() - dateB.toMillis();
    });

    const content = (
        <Stack gap="xs">
            {sortedGames.map((game) => (
                <GameCard
                    key={game.$id}
                    primaryColor={primaryColor}
                    mb={0}
                    {...game}
                />
            ))}
        </Stack>
    );

    if (height && height !== "auto") {
        return <ScrollArea h={height}>{content}</ScrollArea>;
    }

    return content;
}
