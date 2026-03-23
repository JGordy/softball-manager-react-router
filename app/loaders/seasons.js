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
            const teamsResponse = await listDocuments(
                "teams",
                [Query.equal("$id", [season.teamId])],
                client,
            );
            season.teams = teamsResponse.rows || [];

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

        return { season };
    } else {
        return { season: {} };
    }
}
