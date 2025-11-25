import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import {
    createSessionClient,
    createAdminClient,
} from "@/utils/appwrite/server";

export async function getUserTeams({ request }) {
    try {
        // Get authenticated user from session
        const { account, teams } = await createSessionClient(request);
        const user = await account.get();
        const userId = user?.$id;

        if (!userId) {
            return { managing: [], playing: [], userId: null };
        }

        const managerTeamIds = [];
        const playerTeamIds = [];

        // Try to get teams from Appwrite Teams API first (for new teams)
        try {
            const userTeams = await teams.list();

            // Check each team to determine user's role
            for (const team of userTeams.teams) {
                try {
                    const memberships = await teams.listMemberships(team.$id);
                    const userMembership = memberships.memberships.find(
                        (m) => m.userId === userId,
                    );

                    if (userMembership) {
                        // Check roles to categorize as manager or player
                        if (
                            userMembership.roles.includes("manager") ||
                            userMembership.roles.includes("owner")
                        ) {
                            managerTeamIds.push(team.$id);
                        } else {
                            playerTeamIds.push(team.$id);
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error checking membership for team ${team.$id}:`,
                        error,
                    );
                }
            }
        } catch (teamsApiError) {
            console.log(
                "No Appwrite Teams found or Teams API not available, checking old memberships table...",
            );
        }

        // FALLBACK: Check old memberships table for teams not yet migrated
        // This ensures existing teams continue to work until migration is run
        try {
            const oldMemberships = await listDocuments("memberships", [
                Query.equal("userId", userId),
            ]);

            for (const membership of oldMemberships.rows) {
                // Skip if we already found this team via Teams API
                if (
                    managerTeamIds.includes(membership.teamId) ||
                    playerTeamIds.includes(membership.teamId)
                ) {
                    continue;
                }

                // Categorize based on role in old memberships table
                if (membership.role === "manager") {
                    managerTeamIds.push(membership.teamId);
                } else {
                    playerTeamIds.push(membership.teamId);
                }
            }
        } catch (membershipsError) {
            console.error(
                "Error checking old memberships table:",
                membershipsError,
            );
        }

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

export async function getTeamById({ teamId, request }) {
    if (teamId) {
        const managerIds = [];
        const userIds = [];

        // Try to get memberships from Appwrite Teams API first (for new teams)
        try {
            // Use Admin client to bypass permission checks for listing team members
            const { teams } = createAdminClient();
            const memberships = await teams.listMemberships(teamId);

            // Extract user IDs and categorize by role
            for (const membership of memberships.memberships) {
                userIds.push(membership.userId);

                if (
                    membership.roles.includes("manager") ||
                    membership.roles.includes("owner")
                ) {
                    managerIds.push(membership.userId);
                }
            }
        } catch (teamsApiError) {
            console.log(
                "No Appwrite Teams memberships found, checking old memberships table...",
            );
            console.error("Teams API error:", teamsApiError);
        }

        // FALLBACK: Check old memberships table if no Teams API memberships found
        if (userIds.length === 0) {
            try {
                const oldMemberships = await listDocuments("memberships", [
                    Query.equal("teamId", teamId),
                ]);

                // Extract manager IDs
                const oldManagerIds = oldMemberships.rows
                    .filter((document) => document.role === "manager")
                    .map((document) => document.userId);
                managerIds.push(...oldManagerIds);

                // Extract all user IDs
                const oldUserIds = oldMemberships.rows.map((m) => m.userId);
                userIds.push(...oldUserIds);
            } catch (membershipsError) {
                console.error(
                    "Error checking old memberships table:",
                    membershipsError,
                );
            }
        }

        // Get all players from users table
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
