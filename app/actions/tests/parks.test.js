import { findOrCreatePark, updatePark } from "../parks";
import { createDocument, updateDocument } from "@/utils/databases";
import { getParkByPlaceId } from "@/loaders/parks";

// Mock dependencies
jest.mock("@/utils/databases", () => ({
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
}));

jest.mock("@/loaders/parks", () => ({
    getParkByPlaceId: jest.fn(),
}));

describe("Parks Actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("findOrCreatePark", () => {
        it("should return existing park if found", async () => {
            const existingPark = { $id: "park1", name: "Existing Park" };
            getParkByPlaceId.mockResolvedValue(existingPark);

            const result = await findOrCreatePark({
                values: {},
                placeId: "place1",
            });

            expect(result).toEqual(existingPark);
            expect(createDocument).not.toHaveBeenCalled();
        });

        it("should create new park if not found", async () => {
            getParkByPlaceId.mockResolvedValue(null);
            const mockValues = {
                name: "New Park",
                location: { lat: 40.7128, lng: -74.006 },
            };
            const newPark = { $id: "park2", name: "New Park" };
            createDocument.mockResolvedValue(newPark);

            const result = await findOrCreatePark({
                values: mockValues,
                placeId: "place2",
            });

            expect(createDocument).toHaveBeenCalledWith(
                "parks",
                "unique-id",
                {
                    name: "New Park",
                    latitude: 40.7128,
                    longitude: -74.006,
                },
                ['read("any")', 'update("users")', 'delete("users")'],
            );
            expect(result).toEqual(newPark);
        });

        it("should create park without placeId", async () => {
            const mockValues = {
                name: "New Park",
                location: { lat: 40.7128, lng: -74.006 },
            };
            const newPark = { $id: "park3" };
            createDocument.mockResolvedValue(newPark);

            const result = await findOrCreatePark({
                values: mockValues,
                placeId: null,
            });

            expect(getParkByPlaceId).not.toHaveBeenCalled();
            expect(createDocument).toHaveBeenCalled();
            expect(result).toEqual(newPark);
        });
    });

    describe("updatePark", () => {
        it("should update park successfully", async () => {
            const parkId = "park1";
            const values = JSON.stringify({ name: "Updated Park" });

            updateDocument.mockResolvedValue({ $id: parkId });

            const result = await updatePark({ values, parkId });

            expect(updateDocument).toHaveBeenCalledWith("parks", parkId, {
                name: "Updated Park",
            });
            expect(result.success).toBe(true);
            expect(result.status).toBe(204);
        });

        it("should not update if parkId or values are missing", async () => {
            const result = await updatePark({ parkId: null, values: null });

            expect(updateDocument).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });
    });
});
