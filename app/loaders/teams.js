import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import { createSessionClient } from "@/utils/appwrite/server";

export async function getUserTeams({ request }) {
    try {
        // Get authenticated user from session
        const { account } = await createSessionClient(request);
        const user = await account.get();
        const userId = user?.$id;

        if (!userId) {
            return { managing: [], playing: [], userId: null };
        }

        // 1. Check relationships table to list memberships for the userId, both manager and player
        const memberships = await listDocuments("memberships", [
            Query.equal("userId", userId),
            Query.equal("role", ["manager", "player"]),
        ]);

        console.log("memberships", memberships);

        // 2. Separate teamIds by role
        const { managerTeamIds, playerTeamIds } = memberships.rows.reduce(
            (acc, m) => {
                if (m.role === "manager") {
                    acc.managerTeamIds.push(m.teamId);
                } else if (m.role === "player") {
                    acc.playerTeamIds.push(m.teamId);
                }
                return acc;
            },
            { managerTeamIds: [], playerTeamIds: [] },
        );

        // 3. Fetch teams for managers and players
        const fetchTeams = async (teamIds) => {
            if (teamIds.length === 0) {
                return [];
            }

            // Batch query: fetch all teams in a single request
            const result = await listDocuments("teams", [
                Query.equal("$id", teamIds),
            ]);
            const teams = result.rows;

            // 1. Batch fetch seasons for all teams
            const allTeamIds = teams.map((t) => t.$id);
            let allSeasons = [];
            if (allTeamIds.length > 0) {
                const seasonsResponse = await listDocuments("seasons", [
                    Query.equal("teamId", allTeamIds),
                ]);
                allSeasons = seasonsResponse.rows || [];
            }

            // 2. Batch fetch games for all seasons
            const allSeasonIds = allSeasons.map((s) => s.$id);
            let allGames = [];
            if (allSeasonIds.length > 0) {
                const gamesResponse = await listDocuments("games", [
                    Query.equal("seasonId", allSeasonIds),
                ]);
                allGames = gamesResponse.rows || [];
            }

            // 3. Map games to seasons
            allSeasons.forEach((season) => {
                season.games = allGames.filter(
                    (g) => g.seasonId === season.$id,
                );
            });

            // 4. Map seasons to teams
            teams.forEach((team) => {
                team.seasons = allSeasons.filter((s) => s.teamId === team.$id);
            });

            return teams;
        };

        const managerTeams = await fetchTeams(managerTeamIds);
        const playerTeams = await fetchTeams(playerTeamIds);

        return { managing: managerTeams, playing: playerTeams, userId };
    } catch (error) {
        console.error("Error getting teams: ", error);
        throw error;
    }
}

export async function getTeamById({ teamId }) {
    if (teamId) {
        // 1. Get memberships
        const memberships = await listDocuments("memberships", [
            Query.equal("teamId", teamId),
        ]);

        // 2. Get the manager's id
        const managerIds = memberships.rows
            .filter((document) => document.role === "manager")
            .map((document) => document.userId);

        // 3. Extract userIds
        const userIds = memberships.rows.map((m) => m.userId);

        // 4. Get all players
        let players = [];
        if (userIds.length > 0) {
            // Batch query: fetch all users in a single request
            const result = await listDocuments("users", [
                Query.equal("$id", userIds),
            ]);
            players = result.rows;
        }

        const teamData = await readDocument("teams", teamId);

        // Manually fetch seasons since TablesDB doesn't auto-populate relationships
        const seasonsResponse = await listDocuments("seasons", [
            Query.equal("teamId", teamId),
        ]);
        const seasons = seasonsResponse.rows || [];

        // Batch fetch games for all seasons
        const seasonIds = seasons.map((s) => s.$id);
        let allGames = [];
        if (seasonIds.length > 0) {
            const gamesResponse = await listDocuments("games", [
                Query.equal("seasonId", seasonIds),
            ]);
            allGames = gamesResponse.rows || [];
        }

        // Map games to seasons
        seasons.forEach((season) => {
            season.games = allGames
                .filter((g) => g.seasonId === season.$id)
                .map((game) => {
                    game.teamName = teamData.name;
                    return game;
                });
        });

        // Attach seasons to teamData
        teamData.seasons = seasons;

        return { teamData, players, managerIds };
    } else {
        return { teamData: {} };
    }
}
