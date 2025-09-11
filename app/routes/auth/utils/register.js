import { account, ID } from "@/appwrite";
import { createDocument } from "@/utils/databases";

export default async function register({ email, password, name }) {
    // Input validation
    if (!email || !password || !name) {
        return { error: "Email, password and name are required." };
    }

    try {
        const user = await account.create(ID.unique(), email, password, name);

        // Create the user document in the database
        const userDocument = await createDocument(
            "users",
            user.$id, // Use the Appwrite user ID as the document ID
            {
                userId: user.$id, // Store the userId (important!)
                firstName: name.split(" ")[0],
                lastName: name.split(" ").slice(1).join(" "),
                email,
            }
        );

        return { email, password, session: user, user };
    } catch (error) {
        console.log("Registration error:", error);
        return { error: error.message || error };
    }
}
