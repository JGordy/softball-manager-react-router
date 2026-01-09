import {
    savePlayerChart,
    saveBattingOrder,
    saveFieldingPositions,
} from "../lineups";
import { updateDocument } from "@/utils/databases";
import { getNotifiableTeamMembers } from "@/utils/teams";
import { sendLineupFinalizedNotification } from "@/actions/notifications";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    updateDocument: jest.fn(),
}));

jest.mock("@/utils/teams", () => ({
    getNotifiableTeamMembers: jest.fn(),
}));

jest.mock("@/actions/notifications", () => ({
    sendLineupFinalizedNotification: jest.fn(),
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

        it("should send notification when sendNotification is true", async () => {
            const mockValues = {
                playerChart: { lineup: ["player1", "player2"] },
            };
            const eventId = "event1";
            const teamId = "team123";

            updateDocument.mockResolvedValue({
                $id: eventId,
                teamId,
                opponent: "Test Opponent",
            });

            getNotifiableTeamMembers.mockResolvedValue(["user1", "user2"]);

            sendLineupFinalizedNotification.mockResolvedValue({
                success: true,
            });

            const result = await savePlayerChart({
                values: mockValues,
                eventId,
                sendNotification: true,
            });

            expect(result.success).toBe(true);
            expect(result.event).toEqual({
                name: "lineup-notified",
                data: {
                    eventId,
                },
            });
            expect(getNotifiableTeamMembers).toHaveBeenCalledWith(teamId);
            expect(sendLineupFinalizedNotification).toHaveBeenCalledWith({
                gameId: eventId,
                teamId,
                userIds: ["user1", "user2"],
                gameName: "Game vs Test Opponent",
            });
        });

        it("should not send notification when sendNotification is false", async () => {
            const mockValues = {
                playerChart: { lineup: ["player1", "player2"] },
            };
            const eventId = "event1";

            updateDocument.mockResolvedValue({
                $id: eventId,
                teamId: "team123",
            });

            const result = await savePlayerChart({
                values: mockValues,
                eventId,
                sendNotification: false,
            });

            expect(result.success).toBe(true);
            expect(result.event).toEqual({
                name: "lineup-saved",
                data: {
                    eventId,
                },
            });
            expect(getNotifiableTeamMembers).not.toHaveBeenCalled();
            expect(sendLineupFinalizedNotification).not.toHaveBeenCalled();
        });

        it("should not fail if notification sending fails", async () => {
            const mockValues = {
                playerChart: { lineup: ["player1", "player2"] },
            };
            const eventId = "event1";

            updateDocument.mockResolvedValue({
                $id: eventId,
                teamId: "team123",
                opponent: "Test",
            });

            getNotifiableTeamMembers.mockResolvedValue(["user1"]);

            sendLineupFinalizedNotification.mockRejectedValue(
                new Error("Notification failed"),
            );

            // Should not throw even if notification fails
            const result = await savePlayerChart({
                values: mockValues,
                eventId,
                sendNotification: true,
            });

            expect(result.success).toBe(true);
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
