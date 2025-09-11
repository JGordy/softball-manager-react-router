import { ID, databases } from "../appwrite.js";

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
};

// Helper function to create a document
export const createDocument = async (collectionType, id, data) => {
    const _id = id || ID.unique();
    try {
        const response = await databases.createDocument(databaseId, collections[collectionType], _id, data);
        return response;
    } catch (error) {
        console.error(`Error creating ${collectionType} document:`, error);
        throw error;
    }
};

// Helper function to list a series of documents
export const listDocuments = async (collectionType, queries) => {
    try {
        const response = await databases.listDocuments(databaseId, collections[collectionType], queries);
        return response;
    } catch (error) {
        console.error(`Error listing ${collectionType} documents:`, error);
        throw error;
    }
};

// Helper function to read a document
export const readDocument = async (collectionType, documentId) => {
    try {
        const response = await databases.getDocument(databaseId, collections[collectionType], documentId);
        return response;
    } catch (error) {
        console.error(`Error reading ${collectionType} document:`, error);
        throw error;
    }
};

// Helper function to update a document
export const updateDocument = async (collectionType, documentId, data) => {
    try {
        const response = await databases.updateDocument(databaseId, collections[collectionType], documentId, data);
        return response;
    } catch (error) {
        console.error(`Error updating ${collectionType} document:`, error);
        throw error;
    }
};

// Helper function to delete a document
export const deleteDocument = async (collectionType, documentId) => {
    try {
        const response = await databases.deleteDocument(databaseId, collections[collectionType], documentId);
        return response;
    } catch (error) {
        console.error(`Error deleting ${collectionType} document:`, error);
        throw error;
    }
};
