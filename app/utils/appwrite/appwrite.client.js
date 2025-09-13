import { Client, Account, Databases, Teams, Users } from "node-appwrite";

export function makeServerAppwrite({ cookieHeader } = {}) {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_HOST_URL)
        .setProject(process.env.APPWRITE_PROJECT_ID);

    if (process.env.APPWRITE_API_KEY)
        client.setKey(process.env.APPWRITE_API_KEY);

    // Optional: if Appwrite is same-site/reverse-proxied and you want to verify user session
    if (cookieHeader) client.setHeaders({ cookie: cookieHeader });

    return {
        account: new Account(client),
        databases: new Databases(client),
        teams: new Teams(client),
        users: new Users(client),
    };
}
