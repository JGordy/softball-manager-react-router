import { joinAchievements } from "../achievements.server";
import { listDocuments, readDocument } from "../databases";

// Mock dependencies
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
                { $id: "ua3", achievementId: "ach1", userId: "user1" }, // Duplicate achievement ID
            ];

            const baseAchievement1 = { $id: "ach1", name: "Achievement 1" };
            const baseAchievement2 = { $id: "ach2", name: "Achievement 2" };

            readDocument
                .mockResolvedValueOnce(baseAchievement1)
                .mockResolvedValueOnce(baseAchievement2);

            const result = await joinAchievements(uaRows, mockClient);

            // Verify readDocument called for unique IDs
            expect(readDocument).toHaveBeenCalledTimes(2);
            expect(readDocument).toHaveBeenCalledWith(
                "achievements",
                "ach1",
                [],
                mockClient,
            );
            expect(readDocument).toHaveBeenCalledWith(
                "achievements",
                "ach2",
                [],
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
            readDocument.mockRejectedValueOnce({ code: 404 });

            const result = await joinAchievements(uaRows, mockClient);

            expect(result[0].achievement).toBeNull();
        });

        it("should skip base fetch if no achievement IDs exist", async () => {
            const uaRows = [{ $id: "ua1" }]; // Missing achievementId
            const result = await joinAchievements(uaRows, mockClient);

            expect(result).toHaveLength(1);
            expect(result[0].achievement).toBeNull();
            expect(readDocument).not.toHaveBeenCalled();
        });
    });
});
