import { ID, Permission, Role } from "node-appwrite";
import {
    createDocument,
    listDocuments,
    deleteDocument,
} from "@/utils/databases";
import { createAdminClient } from "@/utils/appwrite/server";

/**
 * Add multiple players to a season's roster in the database.
 *
 * @param {Object} params
 * @param {string[]} params.playerIds - Array of player user IDs to add
 * @param {string} params.teamId - The team ID
 * @param {string} params.seasonId - The season ID
 * @param {Object} params.client - Appwrite client
 */
export async function addPlayersToSeasonRoster({
    playerIds,
    teamId,
    seasonId,
    client: _client,
}) {
    if (!playerIds || playerIds.length === 0) return { success: true };

    const adminClient = createAdminClient();

    const promises = playerIds.map((playerId) => {
        const docId = ID.unique();
        const permissions = [
            Permission.read(Role.team(teamId)),
            Permission.read(Role.user(playerId)),
            Permission.update(Role.team(teamId, "manager")),
            Permission.delete(Role.team(teamId, "manager")),
        ];

        const data = {
            playerId,
            teamId,
            seasonId,
            joinedAt: new Date().toISOString(),
        };

        return createDocument(
            "season_rosters",
            docId,
            data,
            permissions,
            adminClient,
        ).catch((err) => {
            // If it already exists, ignore the error
            if (err.code === 409 || err.message?.includes("already exists")) {
                return null;
            }
            throw err;
        });
    });

    await Promise.all(promises);
    return { success: true };
}

/**
 * Synchronize/update a season's roster by comparing the current roster with the target list.
 * Adds missing players and removes unselected ones.
 *
 * @param {Object} params
 * @param {string[]} params.playerIds - Array of player user IDs that should be in the season
 * @param {string} params.teamId - The team ID
 * @param {string} params.seasonId - The season ID
 * @param {Object} params.client - Appwrite client
 */
export async function updateSeasonRoster({
    playerIds,
    teamId,
    seasonId,
    client,
}) {
    // 1. Get current season roster entries
    const currentRoster = await getSeasonRoster({ seasonId, client });
    const currentIds = currentRoster.map((r) => r.playerId);

    // 2. Identify additions and removals
    const toAdd = playerIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentRoster.filter(
        (r) => !playerIds.includes(r.playerId),
    );

    // 3. Perform additions
    await addPlayersToSeasonRoster({
        playerIds: toAdd,
        teamId,
        seasonId,
        client,
    });

    // 4. Perform removals (delete the matching season_rosters documents)
    const removePromises = toRemove.map((doc) =>
        deleteDocument("season_rosters", doc.$id, client),
    );
    await Promise.all(removePromises);

    return {
        success: true,
        message: "Season roster updated successfully",
    };
}

/**
 * Retrieve the season roster list from the database.
 *
 * @param {Object} params
 * @param {string} params.seasonId - The season ID
 * @param {Object} params.client - Appwrite client
 * @returns {Promise<Object[]>}
 */
export async function getSeasonRoster({ seasonId, client }) {
    const { Query } = await import("node-appwrite");
    try {
        const response = await listDocuments(
            "season_rosters",
            [Query.equal("seasonId", seasonId), Query.limit(100)],
            client,
        );
        return response.rows || [];
    } catch (error) {
        console.error("Error fetching season roster:", error);
        return [];
    }
}
