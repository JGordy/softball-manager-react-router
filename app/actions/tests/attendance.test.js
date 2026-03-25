import { updatePlayerAttendance } from "../attendance";
import {
    createDocument,
    listDocuments,
    updateDocument,
    readDocument,
} from "@/utils/databases";

jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    listDocuments: jest.fn(),
    updateDocument: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(),
}));

import { createAdminClient } from "@/utils/appwrite/server";

describe("Attendance Actions", () => {
    let mockAdminClient;
    let mockAdminTeams;
    let mockAccountGet;
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});

        mockAdminTeams = {
            listMemberships: jest.fn().mockResolvedValue({
                memberships: [
                    { userId: "user-manager-id", roles: ["manager"] },
                ],
            }),
        };

        mockAdminClient = {
            teams: mockAdminTeams,
            id: "mock-admin-client",
        };

        createAdminClient.mockReturnValue(mockAdminClient);

        mockAccountGet = jest.fn().mockResolvedValue({ $id: "player1" });

        mockClient = {
            account: { get: mockAccountGet },
            id: "mock-session-client",
        };

        readDocument.mockResolvedValue({ teamId: "team1" });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("updatePlayerAttendance", () => {
        const mockValues = {
            playerId: "player1",
            teamId: "team1",
            status: "accepted",
        };
        const eventId = "event1";

        it("should create new attendance when no documents exist", async () => {
            listDocuments.mockResolvedValue({ rows: [] });
            createDocument.mockResolvedValue({ $id: "att1" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
                client: mockClient,
            });

            expect(listDocuments).toHaveBeenCalledWith(
                "attendance",
                [expect.any(String)],
                mockAdminClient,
            );
            expect(createDocument).toHaveBeenCalledWith(
                "attendance",
                expect.any(String),
                {
                    gameId: eventId,
                    playerId: "player1",
                    status: "accepted",
                },
                expect.any(Array), // permissions array
                mockAdminClient,
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should create new attendance when player not found in existing documents", async () => {
            listDocuments.mockResolvedValue({
                rows: [{ $id: "att1", playerId: "player2" }],
            });
            createDocument.mockResolvedValue({ $id: "att2" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
                client: mockClient,
            });

            expect(createDocument).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should update existing attendance when player is found", async () => {
            listDocuments.mockResolvedValue({
                rows: [{ $id: "att1", playerId: "player1" }],
            });
            updateDocument.mockResolvedValue({ $id: "att1" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
                client: mockClient,
            });

            expect(updateDocument).toHaveBeenCalledWith(
                "attendance",
                "att1",
                {
                    status: "accepted",
                },
                mockAdminClient,
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should deny access if user is not authorized", async () => {
            // User is not the player, AND not a manager/owner
            mockAccountGet.mockResolvedValue({ $id: "random-guy" });
            mockAdminTeams.listMemberships.mockResolvedValue({
                memberships: [{ userId: "random-guy", roles: [] }], // No manager role
            });

            const result = await updatePlayerAttendance({
                values: {
                    playerId: "player1",
                    teamId: "team1",
                    status: "accepted",
                },
                eventId,
                client: mockClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(403);
            expect(result.error).toMatch(/Unauthorized/);
        });

        it("should bypass authorization checks when bypassAuth is true", async () => {
            listDocuments.mockResolvedValue({ rows: [] });
            createDocument.mockResolvedValue({ $id: "att1" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
                client: mockClient,
                bypassAuth: true,
            });

            expect(mockAccountGet).not.toHaveBeenCalled();
            expect(createDocument).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should reject attendance update if game teamId does not match provided teamId", async () => {
            const { readDocument } = require("@/utils/databases");
            readDocument.mockResolvedValue({ teamId: "different-team" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
                client: mockClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(result.error).toMatch(/Invalid team association/);
        });

        it("should handle errors gracefully", async () => {
            mockAccountGet.mockRejectedValue(new Error("Database error"));

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
                client: mockClient,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
            expect(result.error).toBe("Database error");
        });
    });
});
