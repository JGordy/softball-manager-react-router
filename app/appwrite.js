import { Client, Account, Databases } from "appwrite";

export const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_HOST_URL)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

export { ID, Query } from "node-appwrite";
