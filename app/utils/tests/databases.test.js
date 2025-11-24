import {
    createDocument,
    listDocuments,
    readDocument,
    updateDocument,
    deleteDocument,
    collections,
} from "../databases";
import { ID } from "node-appwrite";

// Mock dependencies
jest.mock("node-appwrite", () => ({
    ID: {
        unique: jest.fn(() => "unique-id"),
    },
}));

const mockTablesDB = {
    createRow: jest.fn(),
    listRows: jest.fn(),
    getRow: jest.fn(),
    updateRow: jest.fn(),
    deleteRow: jest.fn(),
};

jest.mock("@/utils/appwrite/server", () => ({
    createAdminClient: jest.fn(() => ({
        tablesDB: mockTablesDB,
    })),
}));

describe("databases utility", () => {
    const dbId = process.env.VITE_APPWRITE_DATABASE_ID;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createDocument", () => {
        it("should create a document with generated ID", async () => {
            mockTablesDB.createRow.mockResolvedValue({ id: "doc-id" });
            const data = { name: "test" };
            const result = await createDocument("users", null, data);

            expect(mockTablesDB.createRow).toHaveBeenCalledWith({
                databaseId: dbId,
                tableId: collections.users,
                rowId: "unique-id",
                data,
                permissions: [], // Default empty permissions array
            });
            expect(result).toEqual({ id: "doc-id" });
        });

        it("should create a document with provided ID", async () => {
            mockTablesDB.createRow.mockResolvedValue({
                id: "provided-id",
            });
            const data = { name: "test" };
            const result = await createDocument("users", "provided-id", data);

            expect(mockTablesDB.createRow).toHaveBeenCalledWith({
                databaseId: dbId,
                tableId: collections.users,
                rowId: "provided-id",
                data,
                permissions: [], // Default empty permissions array
            });
            expect(result).toEqual({ id: "provided-id" });
        });

        it("should create a document with permissions", async () => {
            mockTablesDB.createRow.mockResolvedValue({
                id: "provided-id",
            });
            const data = { name: "test" };
            const permissions = [
                'read("team:123")',
                'update("team:123/manager")',
            ];
            const result = await createDocument(
                "users",
                "provided-id",
                data,
                permissions,
            );

            expect(mockTablesDB.createRow).toHaveBeenCalledWith({
                databaseId: dbId,
                tableId: collections.users,
                rowId: "provided-id",
                data,
                permissions,
            });
            expect(result).toEqual({ id: "provided-id" });
        });

        it("should throw error on failure", async () => {
            mockTablesDB.createRow.mockRejectedValue(new Error("DB Error"));
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
            const mockRows = [];
            mockTablesDB.listRows.mockResolvedValue({ rows: mockRows });
            const queries = ["query"];

            const result = await listDocuments("users", queries);

            expect(mockTablesDB.listRows).toHaveBeenCalledWith({
                databaseId: dbId,
                tableId: collections.users,
                queries,
            });
            expect(result.rows).toEqual(mockRows);
        });

        it("should throw error on failure", async () => {
            mockTablesDB.listRows.mockRejectedValue(new Error("DB Error"));
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
            mockTablesDB.getRow.mockResolvedValue(mockResponse);

            const result = await readDocument("users", "doc-id");

            expect(mockTablesDB.getRow).toHaveBeenCalledWith({
                databaseId: dbId,
                tableId: collections.users,
                rowId: "doc-id",
            });
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on failure", async () => {
            mockTablesDB.getRow.mockRejectedValue(new Error("DB Error"));
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
            mockTablesDB.updateRow.mockResolvedValue(mockResponse);
            const data = { name: "updated" };

            const result = await updateDocument("users", "doc-id", data);

            expect(mockTablesDB.updateRow).toHaveBeenCalledWith({
                databaseId: dbId,
                tableId: collections.users,
                rowId: "doc-id",
                data,
            });
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on failure", async () => {
            mockTablesDB.updateRow.mockRejectedValue(new Error("DB Error"));
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
            mockTablesDB.deleteRow.mockResolvedValue(mockResponse);

            const result = await deleteDocument("users", "doc-id");

            expect(mockTablesDB.deleteRow).toHaveBeenCalledWith({
                databaseId: dbId,
                tableId: collections.users,
                rowId: "doc-id",
            });
            expect(result).toEqual(mockResponse);
        });

        it("should throw error on failure", async () => {
            mockTablesDB.deleteRow.mockRejectedValue(new Error("DB Error"));
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
