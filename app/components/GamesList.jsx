import { Center, ScrollArea, Text } from "@mantine/core";

import GameCard from "@/components/GameCard";
import { DateTime } from "luxon";

export default function GamesList({
    games,
    height = "48vh",
    sortOrder = "asc",
}) {
    if (!games.length) {
        return (
            <Center mt="md">
                <Text>No games currently listed.</Text>
            </Center>
        );
    }

    const today = DateTime.local();

    const sortedGames = [...games].sort((a, b) => {
        const zoneA = a.timeZone || today.zoneName;
        const zoneB = b.timeZone || today.zoneName;

        const dateA = DateTime.fromISO(a.gameDate, { zone: "utc" }).setZone(
            zoneA,
        );
        const dateB = DateTime.fromISO(b.gameDate, { zone: "utc" }).setZone(
            zoneB,
        );

        const isPastA = dateA.startOf("day") < today.startOf("day");
        const isPastB = dateB.startOf("day") < today.startOf("day");

        if (isPastA && !isPastB) return 1;
        if (!isPastA && isPastB) return -1;

        // If both are past, sort descending (most recent first)
        if (isPastA && isPastB) {
            return dateB - dateA;
        }

        // Both are future, sort by sortOrder
        if (sortOrder === "dsc") return dateB - dateA;
        return dateA - dateB;
    });

    return (
        <ScrollArea h={height}>
            {sortedGames.map((game) => (
                <GameCard {...game} key={game.$id} />
            ))}
        </ScrollArea>
    );
}
