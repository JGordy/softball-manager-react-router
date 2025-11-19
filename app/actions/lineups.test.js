import { savePlayerChart } from "./lineups";
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
});
