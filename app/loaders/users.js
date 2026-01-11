import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

export async function getUserById({ userId }) {
    return await readDocument("users", userId);
}

export async function getAttendanceByUserId({ userId }) {
    const attendance = await listDocuments("attendance", [
        Query.equal("playerId", userId),
        Query.equal("status", "accepted"),
    ]);

    return attendance.rows.length > 0 ? attendance.rows : [];
}

export async function getAwardsByUserId({ userId }) {
    const awards = await listDocuments("awards", [
        Query.equal("winner_user_id", userId),
    ]);

    return awards.rows.length > 0 ? awards.rows : [];
}

export async function getStatsByUserId({ userId }) {
    // 1. Fetch last 100 game logs for the user
    const logsResponse = await listDocuments("game_logs", [
        Query.equal("playerId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
    ]);

    const logs = logsResponse.rows;

    if (logs.length === 0) {
        return { logs: [], games: [] };
    }

    // 2. Extract unique game IDs
    const gameIds = [...new Set(logs.map((log) => log.gameId))];

    // 3. Fetch game details for these games
    const gamesResponse = await listDocuments("games", [
        Query.equal("$id", gameIds),
    ]);

    return {
        logs,
        games: gamesResponse.rows,
    };
}
