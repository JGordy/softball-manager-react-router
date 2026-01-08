import { Client, Databases, Account } from "appwrite";

const client = new Client();

const endpoint = import.meta.env.VITE_APPWRITE_HOST_URL;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (endpoint && projectId) {
    client.setEndpoint(endpoint).setProject(projectId);
    // Let the SDK handle the Realtime endpoint automatically based on the API endpoint
} else {
    console.error(
        "Appwrite client configuration error: VITE_APPWRITE_HOST_URL or VITE_APPWRITE_PROJECT_ID is not defined. " +
            "Please ensure these environment variables are set.",
    );
}

export const databases = new Databases(client);
export const account = new Account(client);
export { client };
