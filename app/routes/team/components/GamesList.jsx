import { Text } from "@mantine/core";

import GamesList from "@/components/GamesList";

import sortByDate from "@/utils/sortByDate";
import { DateTime } from "luxon";

/**
 * Finds the most appropriate season to display games for.
 * Priority: Current season > Upcoming season > Most recent past season
 * If the selected season has no games, falls back to the most recent season with games.
 */
function findSeasonWithGames(seasons, today) {
    // Helper to sort seasons by end date (most recent first)
    const sortByEndDateDesc = (a, b) =>
        DateTime.fromISO(b.endDate).toMillis() -
        DateTime.fromISO(a.endDate).toMillis();

    // Find the default season based on date logic
    let defaultSeason = seasons.find((season) => {
        const start = DateTime.fromISO(season.startDate);
        const end = DateTime.fromISO(season.endDate);
        return start <= today && end >= today;
    });

    if (!defaultSeason) {
        const upcomingSeasons = seasons.filter(
            (season) => DateTime.fromISO(season.startDate) > today,
        );
        if (upcomingSeasons.length > 0) {
            defaultSeason = upcomingSeasons[0];
        } else {
            const pastSeasons = seasons
                .filter(
                    (season) =>
                        DateTime.fromISO(season.endDate).toMillis() <
                        today.toMillis(),
                )
                .sort(sortByEndDateDesc);
            if (pastSeasons.length > 0) {
                defaultSeason = pastSeasons[0];
            }
        }
    }

    // If the default season has games, use it
    if (defaultSeason?.games?.length > 0) {
        return defaultSeason;
    }

    // Otherwise, find the most recent season that has games
    const seasonsWithGames = seasons
        .filter((season) => season.games?.length > 0)
        .sort(sortByEndDateDesc);

    if (seasonsWithGames.length > 0) {
        return seasonsWithGames[0];
    }

    // No seasons have games
    return defaultSeason;
}

export default function GamesListContainer({ seasons }) {
    const today = DateTime.local();
    const seasonToDisplay = findSeasonWithGames(seasons, today);
    const gamesToDisplay = seasonToDisplay?.games || [];
    const sortedGames = sortByDate(gamesToDisplay, "gameDate");

    return (
        <div>
            {seasonToDisplay?.seasonName && (
                <Text size="lg" fw={700} mt="md" mb="sm" c="dimmed">
                    {seasonToDisplay.seasonName}
                </Text>
            )}
            <GamesList games={sortedGames} height="55vh" />
        </div>
    );
}
