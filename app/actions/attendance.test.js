import { updatePlayerAttendance } from "./attendance";
import {
    createDocument,
    listDocuments,
    updateDocument,
} from "@/utils/databases";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    listDocuments: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(
            (field, value) =>
                `Query.equal("${field}", ${JSON.stringify(value)})`,
        ),
    },
    ID: {
        unique: jest.fn(() => "unique-id"),
    },
}));

describe("Attendance Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("updatePlayerAttendance", () => {
        const mockValues = {
            playerId: "player1",
            status: "accepted",
        };
        const eventId = "event1";

        it("should create new attendance when no documents exist", async () => {
            listDocuments.mockResolvedValue({ documents: [] });
            createDocument.mockResolvedValue({ $id: "att1" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
            });

            expect(listDocuments).toHaveBeenCalledWith("attendance", [
                expect.any(String),
            ]);
            expect(createDocument).toHaveBeenCalledWith(
                "attendance",
                "unique-id",
                {
                    gameId: eventId,
                    playerId: "player1",
                    status: "accepted",
                },
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should create new attendance when player not found in existing documents", async () => {
            listDocuments.mockResolvedValue({
                documents: [{ $id: "att1", playerId: "player2" }],
            });
            createDocument.mockResolvedValue({ $id: "att2" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
            });

            expect(createDocument).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should update existing attendance when player is found", async () => {
            listDocuments.mockResolvedValue({
                documents: [{ $id: "att1", playerId: "player1" }],
            });
            updateDocument.mockResolvedValue({ $id: "att1" });

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
            });

            expect(updateDocument).toHaveBeenCalledWith("attendance", "att1", {
                status: "accepted",
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should handle errors gracefully", async () => {
            listDocuments.mockRejectedValue(new Error("Database error"));

            const result = await updatePlayerAttendance({
                values: mockValues,
                eventId,
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
            expect(result.error).toBe("Database error");
        });
    });
});
