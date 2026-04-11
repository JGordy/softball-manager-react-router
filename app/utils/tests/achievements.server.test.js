import { Query } from "node-appwrite";
import { joinAchievements } from "../achievements.server";
import { listDocuments } from "../databases";

// Mock dependencies
jest.mock("../databases", () => ({
    listDocuments: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn((field, value) => ({ field, value, type: "equal" })),
    },
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
            expect(listDocuments).not.toHaveBeenCalled();
        });

        it("should join user achievements with base achievement documents", async () => {
            const uaRows = [
                { $id: "ua1", achievementId: "ach1", userId: "user1" },
                { $id: "ua2", achievementId: "ach2", userId: "user1" },
                { $id: "ua3", achievementId: "ach1", userId: "user1" }, // Duplicate achievement ID
            ];

            const baseAchievements = [
                { $id: "ach1", name: "Achievement 1" },
                { $id: "ach2", name: "Achievement 2" },
            ];

            listDocuments.mockResolvedValueOnce({ rows: baseAchievements });

            const result = await joinAchievements(uaRows, mockClient);

            // Verify ID collection (should have unique IDs: ach1, ach2)
            expect(Query.equal).toHaveBeenCalledWith("$id", ["ach1", "ach2"]);
            expect(listDocuments).toHaveBeenCalledWith(
                "achievements",
                [
                    expect.objectContaining({
                        field: "$id",
                        value: ["ach1", "ach2"],
                    }),
                ],
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
            listDocuments.mockResolvedValueOnce({ rows: [] });

            const result = await joinAchievements(uaRows, mockClient);

            expect(result[0].achievement).toBeNull();
        });

        it("should skip base fetch if no achievement IDs exist", async () => {
            const uaRows = [{ $id: "ua1" }]; // Missing achievementId
            const result = await joinAchievements(uaRows, mockClient);

            expect(result).toHaveLength(1);
            expect(result[0].achievement).toBeNull();
            expect(listDocuments).not.toHaveBeenCalled();
        });
    });
});
