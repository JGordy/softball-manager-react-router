import { getAppwriteClient } from "@/utils/appwrite/context";

export async function action({ request, context }) {
    try {
        const { account } = await getAppwriteClient({ request, context });
        const origin = new URL(request.url).origin;

        await account.createVerification(`${origin}/verify`);

        return { success: true };
    } catch (error) {
        console.error("Resend verification error:", error);
        return { success: false, error: error.message, status: 500 };
    }
}
