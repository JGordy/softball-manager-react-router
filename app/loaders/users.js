import { Query } from "node-appwrite";
import { readDocument, listDocuments } from "@/utils/databases";

export async function getUserById({ userId }) {
    return await readDocument("users", userId);
}

export async function getAttendanceByUserId({ userId }) {
    try {
        const attendance = await listDocuments("attendance", [
            Query.equal("playerId", userId),
            Query.limit(100),
        ]);

        return attendance.rows || [];
    } catch (e) {
        console.error("Error fetching attendance:", e);
        return [];
    }
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
        return { logs: [], games: [], teams: [] };
    }

    // 2. Extract unique game IDs
    const gameIds = [...new Set(logs.map((log) => log.gameId))];

    // 3. Fetch game details for these games
    const gamesResponse = await listDocuments("games", [
        Query.equal("$id", gameIds),
        Query.select(["gameDate", "opponent", "teamId"]),
    ]);

    const games = gamesResponse.rows;

    // 4. Extract unique team IDs
    const teamIds = [...new Set(games.map((game) => game.teamId))];

    let teamsResponse;
    // 5. Fetch team details for these games
    if (teamIds?.length > 0) {
        teamsResponse = await listDocuments("teams", [
            Query.equal("$id", teamIds),
            Query.select(["name", "displayName"]),
        ]);
    }

    return {
        logs,
        games: gamesResponse.rows,
        teams: teamsResponse?.rows || [],
    };
}
