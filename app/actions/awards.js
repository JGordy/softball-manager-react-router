import { ID, Permission, Role } from "node-appwrite";
import { createDocument, updateDocument } from "@/utils/databases.js";
export async function sendAwardVotes({ values, eventId, client }) {
    if (!client)
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );

    const { playerVotes, voter_user_id, team_id, ...rest } = values;

    const votes = JSON.parse(playerVotes);

    const categories = votes && Object.keys(votes);

    try {
        // Build permissions array if we have team_id
        // Votes can be read by team, updated/deleted by voter
        const permissions = team_id
            ? [
                  Permission.read(Role.team(team_id)), // Team members can see votes
                  Permission.update(Role.user(voter_user_id)), // Only the voter can update
                  Permission.delete(Role.user(voter_user_id)), // Only the voter can delete
              ]
            : [];

        const promises = categories.map((category) => {
            const vote = votes[category];
            if (vote.vote_id) {
                return updateDocument(
                    "votes",
                    vote.vote_id,
                    {
                        nominated_user_id: vote.nominated_user_id,
                    },
                    client,
                );
            } else {
                return createDocument(
                    "votes",
                    ID.unique(),
                    {
                        ...rest,
                        team_id,
                        game_id: eventId,
                        nominated_user_id: vote.nominated_user_id,
                        reason: category,
                        voter_user_id,
                    },
                    permissions,
                    client,
                );
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

export async function updateAwardVote({ voteId, values, client }) {
    if (voteId && values) {
        const parsedVoteDetails = JSON.parse(values);

        try {
            if (!client)
                throw new Error(
                    "A constructed 'client' object is strictly required for authorization.",
                );
            const voteDetails = await updateDocument(
                "votes",
                voteId,
                parsedVoteDetails,
                client,
            );

            return { response: { voteDetails }, status: 204, success: true };
        } catch (error) {
            console.error("Error updating vote:", error);
            throw error;
        }
    }
}
