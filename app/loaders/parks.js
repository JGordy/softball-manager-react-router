import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases.js";

export async function getParkById({ parkId }) {
    try {
        const response = await readDocument("parks", parkId);

        return response || {};
    } catch (error) {
        console.error("Error fetching park by place_id:", error);
        return null;
    }
}

export async function getParkByPlaceId({ placeId }) {
    try {
        const response = await listDocuments("parks", [
            Query.equal("placeId", placeId),
            Query.limit(1),
        ]);

        return response.rows.length > 0 ? response.rows[0] : null;
    } catch (error) {
        console.error("Error fetching park by placeId:", error);
        return null;
    }
}
