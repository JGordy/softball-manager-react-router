export default function getFutureGames({
    teams,
    teamId,
    futureOnly = false,
    pastOnly = false,
}) {

    const currentDate = new Date();

    const games = teams
        // 1. Filter by teamId if provided, otherwise include all teams
        .filter(team => teamId === undefined || team.$id === teamId)
        // 2. FlatMap: Extract all seasons from the matched team(s), handle missing seasons
        .flatMap(team => team.seasons || [])
        // 3. FlatMap: Extract all games from all seasons, handle missing games
        .flatMap(season => season.games || [])
        // 4. Filter: Keep specified games and handle invalid dates
        .filter(game => {
            // Check for mutual exclusivity
            if (futureOnly && pastOnly) {
                console.error("futureOnly and pastOnly cannot both be true.");
                return false; // Or throw an error
            }

            try {
                const gameDate = new Date(game.gameDate);

                // Future games
                if (futureOnly) {
                    return gameDate > currentDate;
                }

                // Past games
                else if (pastOnly) {
                    return gameDate < currentDate;
                }

                // All games
                else {
                    return true;
                }
            } catch (error) {
                console.error(`Invalid date format: ${game.gameDate}`, error);
                return false;
            }
        });

    // 5. Sort all future games by gameDate
    games.sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

    return games;
}