import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

export async function getUserById({ userId }) {
    return await readDocument("users", userId);
}

export async function getTeamsByUserId({ userId }) {
    // 1. Check relationships table to list memberships for the userId, manager
    const memberships = await listDocuments("memberships", [
        Query.equal("userId", userId),
        Query.equal("role", ["manager", "player"]),
    ]);

    // 2. Extract teamIds
    const teamIds = memberships.rows.map((m) => m.teamId);

    // 3. Batch fetch all teams in a single query
    let teams = [];
    if (teamIds.length > 0) {
        const result = await listDocuments("teams", [
            Query.equal("$id", teamIds),
        ]);
        teams = result.rows || [];
    }

    return teams;
}

export async function getAttendanceByUserId({ userId }) {
    const attendance = await listDocuments("attendance", [
        Query.equal("playerId", userId),
        Query.equal("status", "accepted"),
    ]);

    return attendance.rows.length > 0 ? attendance.rows : [];
}

export async function getAwardsByUserId({ userId }) {
    // const { total, documents } = await listDocuments("users", [
    //     Query.equal("userId", userId),
    // ]);

    // if (total === 0) {
    //     return [];
    // }

    const awards = await listDocuments("awards", [
        Query.equal("winner_user_id", userId),
    ]);

    return awards.rows.length > 0 ? awards.rows : [];
}
