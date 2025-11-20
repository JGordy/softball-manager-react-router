import {
    createDocument,
    listDocuments,
    readDocument,
    updateDocument,
    deleteDocument,
    collections,
} from "./databases";
import { ID } from "node-appwrite";

// Mock dependencies
jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-id"),
    },
}));

const mockDatabases = {
    createDocument: jest.fn(),
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
};

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(() => ({
        databases: mockDatabases,
    })),
}));

describe("databases utility", () => {
    const dbId = process.env.VITE_APPWRITE_DATABASE_ID;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createDocument", () => {
        it("should create a document with generated ID", async () => {
            mockDatabases.createDocument.mockResolvedValue({ id: "doc-id" });
            const data = { name: "test" };
            const result = await createDocument("users", null, data);

            expect(mockDatabases.createDocument).toHaveBeenCalledWith(
                dbId,
                collections.users,
                "unique-id",
                data,
            );
            expect(result).toEqual({ id: "doc-id" });
        });

        it("should create a document with provided ID", async () => {
            mockDatabases.createDocument.mockResolvedValue({
                id: "provided-id",
            });
            const data = { name: "test" };
            const result = await createDocument("users", "provided-id", data);

            expect(mockDatabases.createDocument).toHaveBeenCalledWith(
                dbId,
                collections.users,
                "provided-id",
                data,
            );
            expect(result).toEqual({ id: "provided-id" });
        });

        it("should throw error on failure", async () => {
            mockDatabases.createDocument.mockRejectedValue(
                new Error("DB Error"),
            );
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await expect(createDocument("users", "id", {})).rejects.toThrow(
                "DB Error",
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe("listDocuments", () => {
        it("should list documents", async () => {
            const mockResponse = { documents: [] };
            mockDatabases.listDocuments.mockResolvedValue(mockResponse);
            const queries = ["query"];

            const result = await listDocuments("users", queries);

            expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
                dbId,
                collections.users,
                queries,
            );
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on failure", async () => {
            mockDatabases.listDocuments.mockRejectedValue(
                new Error("DB Error"),
            );
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await expect(listDocuments("users", [])).rejects.toThrow(
                "DB Error",
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe("readDocument", () => {
        it("should read a document", async () => {
            const mockResponse = { id: "doc-id" };
            mockDatabases.getDocument.mockResolvedValue(mockResponse);

            const result = await readDocument("users", "doc-id");

            expect(mockDatabases.getDocument).toHaveBeenCalledWith(
                dbId,
                collections.users,
                "doc-id",
            );
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on failure", async () => {
            mockDatabases.getDocument.mockRejectedValue(new Error("DB Error"));
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await expect(readDocument("users", "doc-id")).rejects.toThrow(
                "DB Error",
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe("updateDocument", () => {
        it("should update a document", async () => {
            const mockResponse = { id: "doc-id", updated: true };
            mockDatabases.updateDocument.mockResolvedValue(mockResponse);
            const data = { name: "updated" };

            const result = await updateDocument("users", "doc-id", data);

            expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
                dbId,
                collections.users,
                "doc-id",
                data,
            );
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on failure", async () => {
            mockDatabases.updateDocument.mockRejectedValue(
                new Error("DB Error"),
            );
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await expect(updateDocument("users", "doc-id", {})).rejects.toThrow(
                "DB Error",
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe("deleteDocument", () => {
        it("should delete a document", async () => {
            const mockResponse = { deleted: true };
            mockDatabases.deleteDocument.mockResolvedValue(mockResponse);

            const result = await deleteDocument("users", "doc-id");

            expect(mockDatabases.deleteDocument).toHaveBeenCalledWith(
                dbId,
                collections.users,
                "doc-id",
            );
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on failure", async () => {
            mockDatabases.deleteDocument.mockRejectedValue(
                new Error("DB Error"),
            );
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await expect(deleteDocument("users", "doc-id")).rejects.toThrow(
                "DB Error",
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });
});
