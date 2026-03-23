import { Query } from "node-appwrite";

import { listDocuments, readDocument } from "@/utils/databases";

import { getSeasonById } from "../seasons";

// Mock dependencies
jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(),
        limit: jest.fn(),
    },
}));

jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("@/utils/appwrite/server", () => ({
    createSessionClient: jest.fn(),
    createAdminClient: jest.fn(),
}));

describe("Seasons Loader", () => {
    const mockSessionClient = { tablesDB: { id: "mock-session-db" } };

    beforeEach(() => {
        jest.clearAllMocks();
        const {
            createSessionClient,
            createAdminClient,
        } = require("@/utils/appwrite/server");
        createSessionClient.mockResolvedValue(mockSessionClient);
        createAdminClient.mockReturnValue({
            teams: {
                listMemberships: jest
                    .fn()
                    .mockResolvedValue({ memberships: [] }),
            },
        });
    });

    describe("getSeasonById", () => {
        it("should return season data when seasonId is provided", async () => {
            const mockSeason = { $id: "season1", name: "Fall 2023" };
            readDocument.mockResolvedValue(mockSeason);
            listDocuments.mockResolvedValue({ rows: [] }); // Mock games query

            const result = await getSeasonById({
                seasonId: "season1",
                client: mockSessionClient,
            });

            expect(readDocument).toHaveBeenCalledWith(
                "seasons",
                "season1",
                [],
                mockSessionClient,
            );
            expect(result.season).toEqual(mockSeason);
            expect(Query.equal).toHaveBeenCalledWith("seasons", "season1");
        });

        it("should return empty object when seasonId is missing", async () => {
            const result = await getSeasonById({
                seasonId: null,
                client: mockSessionClient,
            });

            expect(readDocument).not.toHaveBeenCalled();
            expect(result.season).toEqual({});
        });
    });
});
