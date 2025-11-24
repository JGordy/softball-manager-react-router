import { ID } from "node-appwrite";
import { createAdminClient } from "@/utils/appwrite/server";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

// Specific collection IDs
export const collections = {
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    teams: import.meta.env.VITE_APPWRITE_TEAMS_COLLECTION_ID,
    memberships: import.meta.env.VITE_APPWRITE_MEMBERSHIPS_COLLECTION_ID,
    seasons: import.meta.env.VITE_APPWRITE_SEASONS_COLLECTION_ID,
    games: import.meta.env.VITE_APPWRITE_GAMES_COLLECTION_ID,
    parks: import.meta.env.VITE_APPWRITE_PARKS_COLLECTION_ID,
    forms: import.meta.env.VITE_APPWRITE_FORMS_COLLECTION_ID,
    attendance: import.meta.env.VITE_APPWRITE_ATTENDANCE_COLLECTION_ID,
    awards: import.meta.env.VITE_APPWRITE_GAME_AWARDS_COLLECTION_ID,
    votes: import.meta.env.VITE_APPWRITE_GAME_VOTES_COLLECTION_ID,
};

// Helper function to create a document
export const createDocument = async (collectionType, id, data) => {
    const { tablesDB } = createAdminClient();
    const _id = id || ID.unique();
    try {
        const response = await tablesDB.createRow({
            databaseId,
            tableId: collections[collectionType],
            rowId: _id,
            data,
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
export const readDocument = async (collectionType, documentId) => {
    const { tablesDB } = createAdminClient();
    try {
        const response = await tablesDB.getRow({
            databaseId,
            tableId: collections[collectionType],
            rowId: documentId,
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
