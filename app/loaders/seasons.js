import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

export async function getSeasonById({ seasonId, client }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    if (seasonId) {
        const season = await readDocument("seasons", seasonId, [], client);

        // Manually fetch teams since TablesDB doesn't auto-populate relationships
        if (season.teamId) {
            const team = await readDocument(
                "teams",
                season.teamId,
                [],
                client,
            ).catch(() => null);
            season.teams = team ? [team] : [];

            try {
                // Fetch managers
                const { teams } = await import("@/utils/appwrite/server").then(
                    (m) => m.createAdminClient(),
                );
                const memberships = await teams.listMemberships(season.teamId);
                const managerIds = memberships.memberships
                    .filter(
                        (m) =>
                            m.roles.includes("manager") ||
                            m.roles.includes("owner"),
                    )
                    .map((m) => m.userId);

                if (season.teams[0]) {
                    season.teams[0].managerIds = managerIds;
                }
            } catch (e) {
                console.error("Error fetching managers for season details", e);
            }
        } else {
            season.teams = [];
        }

        // Manually fetch games for this season
        const gamesResponse = await listDocuments(
            "games",
            [
                Query.equal("seasons", seasonId),
                Query.limit(100), // Increase limit to get all games
            ],
            client,
        );
        season.games = gamesResponse.rows || [];

        // Fetch team players and logs for stats aggregation
        let players = [];
        let logs = [];
        if (season.teamId) {
            try {
                const { getTeamById } = await import("./teams");
                const teamInfo = await getTeamById({
                    teamId: season.teamId,
                    client,
                });
                players = teamInfo.players || [];
                const gameIds = season.games.map((g) => g.$id);
                if (gameIds.length > 0) {
                    logs = (teamInfo.teamLogs || []).filter((log) =>
                        gameIds.includes(log.gameId),
                    );
                }
            } catch (err) {
                console.error(
                    "Error fetching team players/logs for season stats:",
                    err,
                );
            }
        }

        return { season, players, logs };
    } else {
        return { season: {}, players: [], logs: [] };
    }
}
