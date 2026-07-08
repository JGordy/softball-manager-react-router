import { Query, Permission, Role } from "node-appwrite";
import { readDocument, listDocuments, createDocument } from "@/utils/databases";
import { joinAchievements } from "@/utils/achievements.server";

export async function getUserById({ userId, client }) {
    return await readDocument("users", userId, [], client);
}

export async function getOrCreateUser({ userId, client }) {
    try {
        return await readDocument("users", userId, [], client);
    } catch (e) {
        // Only attempt self-heal for missing document errors (404);
        // re-throw permission, network, or other errors immediately.
        if (e?.code !== 404) {
            throw e;
        }

        console.warn(
            "getOrCreateUser - User document not found, attempting self-heal:",
            e.message,
        );

        try {
            // Get user account details from Appwrite Auth
            const userAccount = await client.account.get();

            const docPermissions = [
                Permission.read(Role.any()),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ];

            let firstName = "";
            let lastName = "";
            if (userAccount.name) {
                const parts = userAccount.name.trim().split(" ");
                firstName = parts[0] || "";
                lastName = parts.slice(1).join(" ") || "";
            }

            return await createDocument(
                "users",
                userId,
                {
                    userId,
                    email: userAccount.email,
                    firstName,
                    lastName,
                    status: "verified",
                    preferredPositions: [],
                    dislikedPositions: [],
                },
                docPermissions,
                client,
            );
        } catch (healError) {
            // Handle race condition: if another request already created the document
            // between our 404 and our create attempt, a 409 conflict is returned.
            // In that case the doc now exists — re-read and return it.
            if (healError?.code === 409) {
                console.warn(
                    "getOrCreateUser - Document already created by concurrent request, re-reading:",
                    healError.message,
                );
                return await readDocument("users", userId, [], client);
            }
            console.error(
                "getOrCreateUser - Failed to self-heal missing user document:",
                healError.message,
            );
            // Throw healError (the actual create failure) rather than the original
            // 404 so callers and logs see the real reason the operation failed.
            throw healError;
        }
    }
}

export async function getAttendanceByUserId({ userId, client }) {
    try {
        const attendance = await listDocuments(
            "attendance",
            [Query.equal("playerId", userId), Query.limit(500)],
            client,
        );

        return attendance.rows || [];
    } catch (e) {
        console.error("Error fetching attendance:", e);
        return [];
    }
}

export async function getAchievementsByUserId({ userId, client }) {
    try {
        const result = await listDocuments(
            "user_achievements",
            [Query.equal("userId", userId), Query.limit(500)],
            client,
        );

        return await joinAchievements(result.rows || [], client);
    } catch (e) {
        console.error("Error fetching user achievements:", e);
        return [];
    }
}

export async function getAwardsByUserId({ userId, client }) {
    const awards = await listDocuments(
        "awards",
        [Query.equal("winner_user_id", userId)],
        client,
    );

    return awards.rows.length > 0 ? awards.rows : [];
}

export async function getStatsByUserId({ userId, client }) {
    try {
        // 1. Fetch last 500 game logs for the user
        const logsResponse = await listDocuments(
            "game_logs",
            [
                Query.or([
                    Query.equal("playerId", userId),
                    Query.contains("scored", userId),
                ]),
                Query.orderDesc("$createdAt"),
                Query.limit(500),
            ],
            client,
        );

        const logs = logsResponse.rows;

        if (logs.length === 0) {
            return { userId, logs: [], games: [], teams: [] };
        }

        // 2. Extract unique game IDs
        const gameIds = [...new Set(logs.map((log) => log.gameId))].filter(
            Boolean,
        );

        // 3. Batch fetch game details using reliable individual reads
        // We process these in small parallel batches to avoid network flooding
        const games = [];
        const gameBatchSize = 10;
        for (let i = 0; i < gameIds.length; i += gameBatchSize) {
            const batchIds = gameIds.slice(i, i + gameBatchSize);
            const batchPromises = batchIds.map((id) =>
                readDocument(
                    "games",
                    id,
                    [Query.select(["gameDate", "opponent", "teamId"])],
                    client,
                ).catch(() => null),
            );
            const batchResults = await Promise.all(batchPromises);
            games.push(...batchResults.filter(Boolean));
        }

        // 4. Extract unique team IDs from fetched games
        const teamIds = [...new Set(games.map((game) => game.teamId))].filter(
            Boolean,
        );

        // 5. Batch fetch team details using reliable individual reads
        const teams = [];
        const teamBatchSize = 10;
        for (let i = 0; i < teamIds.length; i += teamBatchSize) {
            const batchIds = teamIds.slice(i, i + teamBatchSize);
            const batchPromises = batchIds.map((id) =>
                readDocument(
                    "teams",
                    id,
                    [Query.select(["name", "displayName"])],
                    client,
                ).catch(() => null),
            );
            const batchResults = await Promise.all(batchPromises);
            teams.push(...batchResults.filter(Boolean));
        }

        return {
            userId,
            logs,
            games,
            teams,
        };
    } catch (err) {
        console.error("[getStatsByUserId] Error:", err);
        return { userId, logs: [], games: [], teams: [] };
    }
}
