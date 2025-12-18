import { Query } from "node-appwrite";

import { listDocuments, readDocument } from "@/utils/databases";

import { getSeasonById } from "../seasons";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

describe("Seasons Loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getSeasonById", () => {
        it("should return season data when seasonId is provided", async () => {
            const mockSeason = { $id: "season1", name: "Fall 2023" };
            readDocument.mockResolvedValue(mockSeason);
            listDocuments.mockResolvedValue({ rows: [] }); // Mock games query

            const result = await getSeasonById({ seasonId: "season1" });

            expect(readDocument).toHaveBeenCalledWith("seasons", "season1");
            expect(result.season).toEqual(mockSeason);
            expect(Query.equal).toHaveBeenCalledWith("seasons", "season1");
        });

        it("should return empty object when seasonId is missing", async () => {
            const result = await getSeasonById({ seasonId: null });

            expect(readDocument).not.toHaveBeenCalled();
            expect(result.season).toEqual({});
        });
    });
});
