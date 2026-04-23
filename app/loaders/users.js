import { Query } from "node-appwrite";
import { readDocument, listDocuments } from "@/utils/databases";
import { joinAchievements } from "@/utils/achievements.server";

export async function getUserById({ userId, client }) {
    return await readDocument("users", userId, [], client);
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
                Query.equal("playerId", userId),
                Query.orderDesc("$createdAt"),
                Query.limit(500),
            ],
            client,
        );

        const logs = logsResponse.rows;

        if (logs.length === 0) {
            return { logs: [], games: [], teams: [] };
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
            logs,
            games,
            teams,
        };
    } catch (err) {
        console.error("[getStatsByUserId] Error:", err);
        return { logs: [], games: [], teams: [] };
    }
}
