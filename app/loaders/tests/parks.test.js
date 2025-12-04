import { Query } from "node-appwrite";

import { listDocuments, readDocument } from "@/utils/databases";

import { getParkById, getParkByPlaceId } from "../parks";

// Mock the dependencies
jest.mock("@/utils/databases", () => ({
    listDocuments: jest.fn(),
    readDocument: jest.fn(),
}));

jest.mock("node-appwrite", () => ({
    Query: {
        equal: jest.fn(),
        limit: jest.fn(),
    },
}));

describe("Parks Loader", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Console error mock to suppress error logs during tests
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("getParkById", () => {
        it("should return park data when found", async () => {
            const mockPark = { $id: "123", name: "Test Park" };
            readDocument.mockResolvedValue(mockPark);

            const result = await getParkById({ parkId: "123" });

            expect(readDocument).toHaveBeenCalledWith("parks", "123");
            expect(result).toEqual(mockPark);
        });

        it("should return empty object if response is null/undefined", async () => {
            readDocument.mockResolvedValue(null);

            const result = await getParkById({ parkId: "123" });

            expect(result).toEqual({});
        });

        it("should return null on error", async () => {
            readDocument.mockRejectedValue(new Error("Database error"));

            const result = await getParkById({ parkId: "123" });

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe("getParkByPlaceId", () => {
        it("should return the first park when found", async () => {
            const mockPark = {
                $id: "123",
                name: "Test Park",
                placeId: "place_123",
            };
            listDocuments.mockResolvedValue({ rows: [mockPark] });
            Query.equal.mockReturnValue('equal("placeId", "place_123")');
            Query.limit.mockReturnValue("limit(1)");

            const result = await getParkByPlaceId({ placeId: "place_123" });

            expect(Query.equal).toHaveBeenCalledWith("placeId", "place_123");
            expect(Query.limit).toHaveBeenCalledWith(1);
            expect(listDocuments).toHaveBeenCalledWith("parks", [
                'equal("placeId", "place_123")',
                "limit(1)",
            ]);
            expect(result).toEqual(mockPark);
        });

        it("should return null when no park is found", async () => {
            listDocuments.mockResolvedValue({ rows: [] });

            const result = await getParkByPlaceId({ placeId: "place_123" });

            expect(result).toBeNull();
        });

        it("should return null on error", async () => {
            listDocuments.mockRejectedValue(new Error("Database error"));

            const result = await getParkByPlaceId({ placeId: "place_123" });

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });
});
