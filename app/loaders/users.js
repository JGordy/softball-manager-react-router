import { Query } from "node-appwrite";
import { readDocument, listDocuments } from "@/utils/databases";

export async function getUserById({ userId, client }) {
    return await readDocument("users", userId, [], client);
}

export async function getAttendanceByUserId({ userId, client }) {
    try {
        const attendance = await listDocuments(
            "attendance",
            [Query.equal("playerId", userId), Query.limit(100)],
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
            [Query.equal("userId", userId), Query.limit(100)],
            client
        );
        const uaRows = result.rows || [];
        if (uaRows.length === 0) return [];

        // Extract unique achievement IDs to fetch only what we need
        const achievementIds = [...new Set(uaRows.map(ua => ua.achievementId).filter(Boolean))];
        let baseMap = new Map();
        
        if (achievementIds.length > 0) {
            // Fetch only the base achievements that this user has earned
            const baseRows = await listDocuments("achievements", [Query.equal("$id", achievementIds)], client);
            baseMap = new Map((baseRows.rows || []).map(a => [a.$id, a]));
        }

        return uaRows.map(ua => ({
            ...ua,
            achievement: baseMap.get(ua.achievementId) || null
        }));
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
    // 1. Fetch last 100 game logs for the user
    const logsResponse = await listDocuments(
        "game_logs",
        [
            Query.equal("playerId", userId),
            Query.orderDesc("$createdAt"),
            Query.limit(100),
        ],
        client,
    );

    const logs = logsResponse.rows;

    if (logs.length === 0) {
        return { logs: [], games: [], teams: [] };
    }

    // 2. Extract unique game IDs
    const gameIds = [...new Set(logs.map((log) => log.gameId))];

    // 3. Fetch game details for these games
    const gamesResponse = await listDocuments(
        "games",
        [
            Query.equal("$id", gameIds),
            Query.select(["gameDate", "opponent", "teamId"]),
        ],
        client,
    );

    const games = gamesResponse.rows;

    // 4. Extract unique team IDs
    const teamIds = [...new Set(games.map((game) => game.teamId))];

    let teamsResponse;
    // 5. Fetch team details for these games
    if (teamIds?.length > 0) {
        teamsResponse = await listDocuments(
            "teams",
            [
                Query.equal("$id", teamIds),
                Query.select(["name", "displayName"]),
            ],
            client,
        );
    }

    return {
        logs,
        games: gamesResponse.rows,
        teams: teamsResponse?.rows || [],
    };
}
