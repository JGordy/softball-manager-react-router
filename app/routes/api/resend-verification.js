import { appwriteClientContext } from "@/contexts/router";

export async function action({ request, context }) {
    try {
        const sessionClient = context.get(appwriteClientContext);
        if (!sessionClient) {
            return { success: false, error: "Unauthorized", status: 401 };
        }
        const { account } = sessionClient;
        const origin = new URL(request.url).origin;

        await account.createVerification(`${origin}/verify`);

        return { success: true };
    } catch (error) {
        console.error("Resend verification error:", error);
        return { success: false, error: error.message, status: 500 };
    }
}
