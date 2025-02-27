export default function getGames({
    teams,
    teamId,
}) {

    const currentDate = new Date();

    const futureGames = [];
    const pastGames = [];

    teams
        // 1. Filter by teamId if provided, otherwise include all teams
        .filter(team => teamId === undefined || team.$id === teamId)
        // 2. FlatMap: Extract all seasons from the matched team(s), handle missing seasons
        .flatMap(team => team.seasons || [])
        // 3. FlatMap: Extract all games from all seasons, handle missing games
        .flatMap(season => season.games || [])
        // 4. Populate futureGames and pastGames
        .forEach(game => {
            try {
                const gameDate = new Date(game.gameDate);

                // Find the team name to add to the game object.
                const team = teams.find(t => t.$id === game.teamId);
                if (team) {
                    game.teamName = team.name; // Add the team name
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

    // Sort future games by earlier to later
    futureGames.sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
    // Sort past games in reverse order
    pastGames.sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

    return { futureGames, pastGames };
}