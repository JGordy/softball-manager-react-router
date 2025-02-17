import { Client, Account, Databases } from 'appwrite';

export const sessionClient = new Client();

sessionClient
    .setEndpoint(import.meta.env.VITE_APPWRITE_HOST_URL)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(sessionClient);
export const databases = new Databases(sessionClient);

export { ID, Query } from 'appwrite';
