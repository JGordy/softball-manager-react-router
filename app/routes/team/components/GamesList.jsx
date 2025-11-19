import GamesList from "@/components/GamesList";

import sortByDate from "@/utils/sortByDate";
import { DateTime } from "luxon";

export default function GamesListContainer({ seasons }) {
    const today = DateTime.local();
    let seasonToDisplay = seasons.find((season) => {
        const start = DateTime.fromISO(season.startDate);
        const end = DateTime.fromISO(season.endDate);
        return start <= today && end >= today;
    });

    if (!seasonToDisplay) {
        const upcomingSeasons = seasons.filter(
            (season) => DateTime.fromISO(season.startDate) > today,
        );
        if (upcomingSeasons.length > 0) {
            seasonToDisplay = upcomingSeasons[0];
        } else {
            const pastSeasons = seasons
                .filter(
                    (season) =>
                        DateTime.fromISO(season.endDate).toMillis() <
                        today.toMillis(),
                )
                .sort(
                    (a, b) =>
                        DateTime.fromISO(b.endDate).toMillis() -
                        DateTime.fromISO(a.endDate).toMillis(),
                );
            if (pastSeasons.length > 0) {
                seasonToDisplay = pastSeasons[0];
            }
        }
    }

    const gamesToDisplay = seasonToDisplay ? seasonToDisplay.games : [];
    const sortedGames = sortByDate(gamesToDisplay, "gameDate");

    return (
        <div style={{ marginTop: "var(--mantine-spacing-xl)" }}>
            <GamesList games={sortedGames} height="55vh" />
        </div>
    );
}
