import { sendAwardVotes, updateAwardVote } from "../awards";
import { createDocument, updateDocument } from "@/utils/databases";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-id"),
    },
}));

describe("Awards Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("sendAwardVotes", () => {
        it("should create new votes", async () => {
            const mockValues = {
                playerVotes: JSON.stringify({
                    MVP: { nominated_user_id: "user1" },
                    "Best Hitter": { nominated_user_id: "user2" },
                }),
                voter_user_id: "voter1",
            };
            const eventId = "event1";

            createDocument.mockResolvedValue({ $id: "vote1" });

            const result = await sendAwardVotes({
                values: mockValues,
                eventId,
            });

            expect(createDocument).toHaveBeenCalledTimes(2);
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
            expect(result.response).toHaveLength(2);
        });

        it("should update existing votes", async () => {
            const mockValues = {
                playerVotes: JSON.stringify({
                    MVP: { nominated_user_id: "user1", vote_id: "vote1" },
                }),
                voter_user_id: "voter1",
            };
            const eventId = "event1";

            updateDocument.mockResolvedValue({ $id: "vote1" });

            const result = await sendAwardVotes({
                values: mockValues,
                eventId,
            });

            expect(updateDocument).toHaveBeenCalledWith("votes", "vote1", {
                nominated_user_id: "user1",
            });
            expect(result.success).toBe(true);
        });

        it("should handle errors", async () => {
            const mockValues = {
                playerVotes: JSON.stringify({
                    MVP: { nominated_user_id: "user1" },
                }),
            };

            createDocument.mockRejectedValue(new Error("Database error"));

            const result = await sendAwardVotes({
                values: mockValues,
                eventId: "event1",
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
        });
    });

    describe("updateAwardVote", () => {
        it("should update vote details", async () => {
            const voteId = "vote1";
            const values = JSON.stringify({ nominated_user_id: "user2" });

            updateDocument.mockResolvedValue({ $id: voteId });

            const result = await updateAwardVote({ voteId, values });

            expect(updateDocument).toHaveBeenCalledWith("votes", voteId, {
                nominated_user_id: "user2",
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should not update if voteId or values are missing", async () => {
            const result = await updateAwardVote({
                voteId: null,
                values: null,
            });

            expect(updateDocument).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });
});
