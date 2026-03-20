import { sendAwardVotes, updateAwardVote } from "../awards";
import { createDocument, updateDocument } from "@/utils/databases";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
}));

describe("Awards Actions", () => {
    const mockRequest = { headers: { get: () => "mock-cookie" } };
    const mockSessionClient = { tablesDB: { id: "mock-session-db" } };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        const { createSessionClient } = require("@/utils/appwrite/server");
        createSessionClient.mockResolvedValue(mockSessionClient);
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
                team_id: "team1",
            };
            const eventId = "event1";

            createDocument.mockResolvedValue({ $id: "vote1" });

            const result = await sendAwardVotes({
                values: mockValues,
                eventId,
                client: mockSessionClient,
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
                team_id: "team1",
            };
            const eventId = "event1";

            updateDocument.mockResolvedValue({ $id: "vote1" });

            const result = await sendAwardVotes({
                values: mockValues,
                eventId,
                client: mockSessionClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "votes",
                "vote1",
                {
                    nominated_user_id: "user1",
                },
                mockSessionClient,
            );
            expect(result.success).toBe(true);
        });

        it("should handle errors", async () => {
            const mockValues = {
                playerVotes: JSON.stringify({
                    MVP: { nominated_user_id: "user1" },
                }),
                voter_user_id: "voter1",
                team_id: "team1",
            };

            createDocument.mockRejectedValue(new Error("Database error"));

            const result = await sendAwardVotes({
                values: mockValues,
                eventId: "event1",
                client: mockSessionClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
        });

        it("should reject without client", async () => {
            const result = sendAwardVotes({
                values: {},
                eventId: "event1",
                client: undefined,
            });

            await expect(result).rejects.toThrow(
                "A constructed 'client' object is strictly required for authorization.",
            );
        });
    });

    describe("updateAwardVote", () => {
        it("should update vote details", async () => {
            const voteId = "vote1";
            const values = JSON.stringify({ nominated_user_id: "user2" });

            updateDocument.mockResolvedValue({ $id: voteId });

            const result = await updateAwardVote({
                voteId,
                values,
                client: mockSessionClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "votes",
                voteId,
                {
                    nominated_user_id: "user2",
                },
                mockSessionClient,
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should not update if voteId or values are missing", async () => {
            const result = await updateAwardVote({
                voteId: null,
                values: null,
                client: mockSessionClient,
            });

            expect(updateDocument).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
        it("should reject without client", async () => {
            const result = updateAwardVote({
                voteId: "vote1",
                values: "{}",
                client: undefined,
            });

            await expect(result).rejects.toThrow(
                "A constructed 'client' object is strictly required for authorization.",
            );
        });
    });
});
