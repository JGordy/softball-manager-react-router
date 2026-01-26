import { ID } from "node-appwrite";
import { createAdminClient } from "@/utils/appwrite/server";

const databaseId = process.env.APPWRITE_DATABASE_ID;

// Specific collection IDs
export const collections = {
    users: process.env.APPWRITE_USERS_COLLECTION_ID,
    teams: process.env.APPWRITE_TEAMS_COLLECTION_ID,
    seasons: process.env.APPWRITE_SEASONS_COLLECTION_ID,
    games: process.env.APPWRITE_GAMES_COLLECTION_ID,
    parks: process.env.APPWRITE_PARKS_COLLECTION_ID,
    forms: process.env.APPWRITE_FORMS_COLLECTION_ID,
    attendance: process.env.APPWRITE_ATTENDANCE_COLLECTION_ID,
    awards: process.env.APPWRITE_GAME_AWARDS_COLLECTION_ID,
    votes: process.env.APPWRITE_GAME_VOTES_COLLECTION_ID,
    game_logs: process.env.APPWRITE_GAME_LOGS_COLLECTION_ID,
};

// Helper function to create a document
export const createDocument = async (
    collectionType,
    id,
    data,
    permissions = [],
) => {
    const { tablesDB } = createAdminClient();
    const _id = id || ID.unique();
    try {
        const response = await tablesDB.createRow({
            databaseId,
            tableId: collections[collectionType],
            rowId: _id,
            data,
            permissions,
        });
        return response;
    } catch (error) {
        console.error(`Error creating ${collectionType} document:`, error);
        throw error;
    }
};

// Helper function to list a series of documents
export const listDocuments = async (collectionType, queries) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.listRows({
            databaseId,
            tableId: collections[collectionType],
            queries,
        });
        return response;
    } catch (error) {
        console.error(`Error listing ${collectionType} documents:`, error);
        throw error;
    }
};

// Helper function to read a document
export const readDocument = async (collectionType, documentId, queries) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.getRow({
            databaseId,
            tableId: collections[collectionType],
            rowId: documentId,
            queries,
        });
        return response;
    } catch (error) {
        console.error(`Error reading ${collectionType} document:`, error);
        throw error;
    }
};

// Helper function to update a document
export const updateDocument = async (collectionType, documentId, data) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.updateRow({
            databaseId,
            tableId: collections[collectionType],
            rowId: documentId,
            data,
        });
        return response;
    } catch (error) {
        console.error(`Error updating ${collectionType} document:`, error);
        throw error;
    }
};

// Helper function to delete a document
export const deleteDocument = async (collectionType, documentId) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.deleteRow({
            databaseId,
            tableId: collections[collectionType],
            rowId: documentId,
        });
        return response;
    } catch (error) {
        console.error(`Error deleting ${collectionType} document:`, error);
        throw error;
    }
};

// Helper function to update document permissions
export const updateDocumentPermissions = async (
    collectionType,
    documentId,
    permissions,
) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.updateRow({
            databaseId,
            tableId: collections[collectionType],
            rowId: documentId,
            permissions,
        });
        return response;
    } catch (error) {
        console.error(`Error updating ${collectionType} permissions:`, error);
        throw error;
    }
};

// Transaction helpers
export const createTransaction = async () => {
    const { tablesDB } = createAdminClient();
    try {
        const transaction = await tablesDB.createTransaction();
        return transaction;
    } catch (error) {
        console.error("Error creating transaction:", error);
        throw error;
    }
};

export const createOperations = async (transactionId, operations) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.createOperations({
            transactionId,
            operations,
        });
        return response;
    } catch (error) {
        console.error("Error creating operations:", error);
        throw error;
    }
};

export const commitTransaction = async (transactionId) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.updateTransaction({
            transactionId,
            commit: true,
        });
        return response;
    } catch (error) {
        console.error("Error committing transaction:", error);
        throw error;
    }
};

export const rollbackTransaction = async (transactionId) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.updateTransaction({
            transactionId,
            rollback: true,
        });
        return response;
    } catch (error) {
        console.error("Error rolling back transaction:", error);
        throw error;
    }
};
