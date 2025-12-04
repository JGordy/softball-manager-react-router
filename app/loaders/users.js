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
