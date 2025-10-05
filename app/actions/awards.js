import { ID } from "@/appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";

export async function sendAwardVotes({ values, eventId }) {
    const { playerVotes, ...rest } = values;

    const votes = JSON.parse(playerVotes);

    const categories = votes && Object.keys(votes);

    try {
        const promises = categories.map((category) => {
            const vote = votes[category];
            if (vote.vote_id) {
                return updateDocument("votes", vote.vote_id, {
                    nominated_user_id: vote.nominated_user_id,
                });
            } else {
                return createDocument("votes", ID.unique(), {
                    ...rest,
                    game_id: eventId,
                    nominated_user_id: vote.nominated_user_id,
                    reason: category,
                });
            }
        });

        return {
            success: true,
            status: 201,
            response: await Promise.all(promises),
        };
    } catch (error) {
        console.error("Error updating award votes:", error);
        return { success: false, error: error.message, status: 500 };
    }
}

export async function updateAwardVote({ voteId, values }) {
    if (voteId && values) {
        const parsedVoteDetails = JSON.parse(values);

        try {
            const voteDetails = await updateDocument(
                "votes",
                voteId,
                parsedVoteDetails,
            );

            return { response: { voteDetails }, status: 204, success: true };
        } catch (error) {
            console.error("Error updating vote:", error);
            throw error;
        }
    }
}
