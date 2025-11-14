import { createSessionClient } from "@/utils/appwrite/server";

export async function action({ request }) {
    try {
        const { account } = await createSessionClient(request);
        const origin = new URL(request.url).origin;

        await account.createVerification(`${origin}/verify`);

        return json({ success: true });
    } catch (error) {
        console.error("Resend verification error:", error);
        return { success: false, error: error.message, status: 500 };
    }
}
