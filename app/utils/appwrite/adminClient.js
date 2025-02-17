import { Client, Account, Databases } from "node-appwrite"; // Using the server SDK

export const adminClient = new Client();

adminClient
    .setEndpoint(import.meta.env.VITE_APPWRITE_HOST_URL)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(import.meta.env.VITE_APPWRITE_API_KEY);

export const account = new Account(adminClient);
export const databases = new Databases(adminClient);

export { ID, Query } from 'appwrite';