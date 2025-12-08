import {
    savePlayerChart,
    saveBattingOrder,
    saveFieldingPositions,
} from "../lineups";
import { updateDocument } from "@/utils/databases";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    updateDocument: jest.fn(),
}));

describe("Lineups Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("savePlayerChart", () => {
        it("should save player chart successfully", async () => {
            const mockValues = {
                playerChart: { lineup: ["player1", "player2"] },
            };
            const eventId = "event1";

            updateDocument.mockResolvedValue({ $id: eventId });

            const result = await savePlayerChart({
                values: mockValues,
                eventId,
            });

            expect(updateDocument).toHaveBeenCalledWith("games", eventId, {
                playerChart: JSON.stringify({ lineup: ["player1", "player2"] }),
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should handle errors", async () => {
            const mockValues = {
                playerChart: { lineup: [] },
            };

            updateDocument.mockRejectedValue(new Error("Database error"));

            await expect(
                savePlayerChart({ values: mockValues, eventId: "event1" }),
            ).rejects.toThrow("Database error");
        });
    });

    describe("saveBattingOrder", () => {
        it("should save batting order successfully with array value", async () => {
            const mockValues = {
                idealLineup: ["player1", "player2", "player3"],
            };
            const teamId = "team1";

            updateDocument.mockResolvedValue({ $id: teamId });

            const result = await saveBattingOrder({
                values: mockValues,
                teamId,
            });

            expect(updateDocument).toHaveBeenCalledWith("teams", teamId, {
                idealLineup: JSON.stringify(["player1", "player2", "player3"]),
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should save batting order with pre-stringified value", async () => {
            const mockValues = {
                idealLineup: '["player1","player2"]',
            };
            const teamId = "team1";

            updateDocument.mockResolvedValue({ $id: teamId });

            const result = await saveBattingOrder({
                values: mockValues,
                teamId,
            });

            expect(updateDocument).toHaveBeenCalledWith("teams", teamId, {
                idealLineup: '["player1","player2"]',
            });
            expect(result.success).toBe(true);
        });

        it("should handle errors", async () => {
            const mockValues = {
                idealLineup: ["player1"],
            };

            updateDocument.mockRejectedValue(new Error("Database error"));

            await expect(
                saveBattingOrder({ values: mockValues, teamId: "team1" }),
            ).rejects.toThrow("Database error");
        });
    });

    describe("saveFieldingPositions", () => {
        it("should save fielding positions successfully with object value", async () => {
            const mockValues = {
                idealPositioning: {
                    Pitcher: ["player1"],
                    Catcher: ["player2"],
                },
            };
            const teamId = "team1";

            updateDocument.mockResolvedValue({ $id: teamId });

            const result = await saveFieldingPositions({
                values: mockValues,
                teamId,
            });

            expect(updateDocument).toHaveBeenCalledWith("teams", teamId, {
                idealPositioning: JSON.stringify({
                    Pitcher: ["player1"],
                    Catcher: ["player2"],
                }),
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should save fielding positions with pre-stringified value", async () => {
            const mockValues = {
                idealPositioning: '{"Pitcher":["player1"]}',
            };
            const teamId = "team1";

            updateDocument.mockResolvedValue({ $id: teamId });

            const result = await saveFieldingPositions({
                values: mockValues,
                teamId,
            });

            expect(updateDocument).toHaveBeenCalledWith("teams", teamId, {
                idealPositioning: '{"Pitcher":["player1"]}',
            });
            expect(result.success).toBe(true);
        });

        it("should handle errors", async () => {
            const mockValues = {
                idealPositioning: { Pitcher: [] },
            };

            updateDocument.mockRejectedValue(new Error("Database error"));

            await expect(
                saveFieldingPositions({ values: mockValues, teamId: "team1" }),
            ).rejects.toThrow("Database error");
        });
    });
});
