import { joinAchievements } from "../achievements.server";
import { listDocuments, readDocument } from "../databases";

// Mock dependencies
jest.mock("node-appwrite");
jest.mock("../databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

describe("achievements utility (server)", () => {
    const mockClient = { tablesDB: { id: "mock-db" } };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("joinAchievements", () => {
        it("should return empty array if input is empty", async () => {
            const result = await joinAchievements([], mockClient);
            expect(result).toEqual([]);
            expect(readDocument).not.toHaveBeenCalled();
        });

        it("should join user achievements with base achievement documents", async () => {
            const uaRows = [
                { $id: "ua1", achievementId: "ach1", userId: "user1" },
                { $id: "ua2", achievementId: "ach2", userId: "user1" },
                { $id: "ua3", achievementId: "ach1", userId: "user1" },
            ];

            const baseAchievements = [
                { $id: "ach1", name: "Achievement 1" },
                { $id: "ach2", name: "Achievement 2" },
            ];

            listDocuments.mockResolvedValueOnce({
                rows: baseAchievements,
                total: 2,
            });

            const result = await joinAchievements(uaRows, mockClient);

            // Verify listDocuments called correctly
            expect(listDocuments).toHaveBeenCalledWith(
                "achievements",
                expect.arrayContaining([expect.stringContaining("limit(500)")]),
                mockClient,
            );

            // Verify mapping
            expect(result).toHaveLength(3);
            expect(result[0].achievement.name).toBe("Achievement 1");
            expect(result[1].achievement.name).toBe("Achievement 2");
            expect(result[2].achievement.name).toBe("Achievement 1");
        });

        it("should handle missing base achievements gracefully", async () => {
            const uaRows = [{ $id: "ua1", achievementId: "missing-ach" }];
            listDocuments.mockResolvedValueOnce({ rows: [], total: 0 });

            const result = await joinAchievements(uaRows, mockClient);

            expect(result[0].achievement).toBeNull();
        });

        it("should skip base fetch if no rows have an achievementId", async () => {
            const uaRows = [{ $id: "ua1" }]; // Missing achievementId
            const result = await joinAchievements(uaRows, mockClient);

            expect(result).toHaveLength(1);
            expect(result[0].achievement).toBeNull();
            expect(listDocuments).not.toHaveBeenCalled();
        });
    });
});
