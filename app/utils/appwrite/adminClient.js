import { Client, Account, Databases, Users, Teams } from 'node-appwrite';

let client = null; // Initialize client to null

export function getAppwriteClient() {
    if (!client) {
        client = new Client();
        client
            .setEndpoint(process.env.APPWRITE_HOST_URL)
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY); // Server API Key
    }
    return client;
}

export const account = new Account(getAppwriteClient());
export const databases = new Databases(getAppwriteClient());
export const users = new Users(getAppwriteClient());
export const teams = new Teams(getAppwriteClient());

export { ID, Query } from 'appwrite';