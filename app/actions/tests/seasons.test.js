import { createSeason, updateSeason } from "../seasons";
import { createDocument, updateDocument } from "@/utils/databases";
import { hasBadWords } from "@/utils/badWordsApi";
import { findOrCreatePark } from "@/actions/parks";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("@/utils/badWordsApi", () => ({
    hasBadWords: jest.fn(),
}));

jest.mock("@/actions/parks", () => ({
    findOrCreatePark: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-season-id"),
    },
}));

describe("Seasons Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
        hasBadWords.mockResolvedValue(false);
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("createSeason", () => {
        it("should create season successfully", async () => {
            const mockValues = {
                seasonName: "Fall 2024",
                gameDays: "Monday,Wednesday",
                signUpFee: "50",
                locationDetails: JSON.stringify({ placeId: "place1" }),
            };
            const teamId = "team1";

            findOrCreatePark.mockResolvedValue({ $id: "park1" });
            createDocument.mockResolvedValue({ $id: "season1" });

            const result = await createSeason({ values: mockValues, teamId });

            expect(createDocument).toHaveBeenCalledWith(
                "seasons",
                "unique-season-id",
                {
                    seasonName: "Fall 2024",
                    gameDays: ["Monday", "Wednesday"],
                    signUpFee: 50,
                    parkId: "park1",
                    teamId,
                    teams: [teamId],
                },
            );
            expect(result.success).toBe(true);
            expect(result.status).toBe(201);
        });

        it("should reject season with bad words in name", async () => {
            hasBadWords.mockResolvedValue(true);

            const mockValues = {
                seasonName: "BadWord Season",
                gameDays: "Monday",
                signUpFee: "50",
            };

            const result = await createSeason({
                values: mockValues,
                teamId: "team1",
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
            expect(createDocument).not.toHaveBeenCalled();
        });

        it("should create season without location", async () => {
            const mockValues = {
                seasonName: "Fall 2024",
                gameDays: "Monday",
                signUpFee: "50",
                locationDetails: "{}",
            };

            createDocument.mockResolvedValue({ $id: "season1" });

            const result = await createSeason({
                values: mockValues,
                teamId: "team1",
            });

            expect(findOrCreatePark).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });

    describe("updateSeason", () => {
        it("should update season successfully", async () => {
            const mockValues = {
                seasonName: "Updated Season",
                gameDays: "Tuesday,Thursday",
                signUpFee: "75",
            };
            const seasonId = "season1";

            updateDocument.mockResolvedValue({ $id: seasonId });

            const result = await updateSeason({ values: mockValues, seasonId });

            expect(updateDocument).toHaveBeenCalledWith("seasons", seasonId, {
                seasonName: "Updated Season",
                gameDays: ["Tuesday", "Thursday"],
                signUpFee: 75,
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should update season with new location", async () => {
            const mockValues = {
                locationDetails: JSON.stringify({ placeId: "place2" }),
            };

            findOrCreatePark.mockResolvedValue({ $id: "park2" });
            updateDocument.mockResolvedValue({ $id: "season1" });

            const result = await updateSeason({
                values: mockValues,
                seasonId: "season1",
            });

            expect(findOrCreatePark).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it("should reject update with bad words", async () => {
            hasBadWords.mockResolvedValue(true);

            const result = await updateSeason({
                values: { seasonName: "BadWord Season" },
                seasonId: "season1",
            });

            expect(result.success).toBe(false);
            expect(result.status).toBe(400);
        });
    });
});
