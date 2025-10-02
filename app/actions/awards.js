import { ID } from "@/appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

export async function sendAwardVotes({ values, eventId }) {
    const { playerVotes, ...rest } = values;

    const votes = JSON.parse(playerVotes);

    const categories = votes && Object.keys(votes);

    const promises = categories.map((category) => {
        return createDocument("votes", ID.unique(), {
            ...rest,
            game_id: eventId,
            nominated_user_id: votes[category],
            reason: category,
        });
    });

    return await Promise.all(promises);
}
