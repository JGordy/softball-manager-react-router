import { DateTime } from "luxon";

export default function getGames({ teams, teamId }) {
    const currentDate = DateTime.local();

    const futureGames = [];
    const pastGames = [];

    teams
        // 1. Filter by teamId if provided, otherwise include all teams
        .filter((team) => teamId === undefined || team.$id === teamId)
        // 2. Extract games: Either from flattened games array (optimized) or nested seasons structure
        .flatMap((team) => {
            if (team.games) {
                // Loader already handled mapping season locations
                return team.games;
            }

            // Fallback for non-optimized structure (nested seasons)
            return (team.seasons || []).flatMap((season) => {
                return (season.games || []).map((game) => ({
                    ...game,
                    location: game.location || season.location,
                }));
            });
        })
        // 3. Populate futureGames and pastGames
        .forEach((game) => {
            try {
                const gameDate = DateTime.fromISO(game.gameDate, {
                    zone: "utc",
                });

                if (!gameDate.isValid) {
                    throw new Error(`Invalid date: ${game.gameDate}`);
                }

                // Find the team name to add to the game object.
                const team = teams.find((t) => t.$id === game.teamId);
                if (team) {
                    game.teamName = team.name; // Add the team name
                    game.displayName = team.displayName || ""; // Add display name if available
                }

                if (gameDate > currentDate) {
                    futureGames.push(game);
                } else {
                    pastGames.push(game);
                }
            } catch (error) {
                console.error(`Invalid date format: ${game.gameDate}`, error);
            }
        });

    // Sort future games by earlier to later (using DateTime)
    futureGames.sort(
        (a, b) =>
            DateTime.fromISO(a.gameDate).toMillis() -
            DateTime.fromISO(b.gameDate).toMillis(),
    );
    // Sort past games in reverse order
    pastGames.sort(
        (a, b) =>
            DateTime.fromISO(b.gameDate).toMillis() -
            DateTime.fromISO(a.gameDate).toMillis(),
    );

    return { futureGames, pastGames };
}
