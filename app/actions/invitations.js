/**
 * CLIENT-SIDE ACTION
 * Invite a player to join a team by email using Appwrite Teams API
 *
 * Uses direct fetch to Appwrite REST API with X-Appwrite-Session header.
 * This bypasses the SDK's cookie handling which conflicts with our SSR session management.
 * Appwrite automatically handles user lookup, account creation, and email sending.
 */
export async function invitePlayerByEmail({ email, teamId, name, url }) {
    try {
        // Fetch the session from our server API
        const sessionResponse = await fetch("/api/session");
        const { session } = await sessionResponse.json();

        if (!session) {
            throw new Error("No active session found. Please log in.");
        }

        // Make direct API call to Appwrite - this bypasses SDK cookie conflicts
        const response = await fetch(
            `${import.meta.env.VITE_APPWRITE_HOST_URL}/teams/${teamId}/memberships`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Appwrite-Project": import.meta.env
                        .VITE_APPWRITE_PROJECT_ID,
                    "X-Appwrite-Session": session,
                },
                body: JSON.stringify({
                    roles: ["player"],
                    email: email,
                    url: url,
                    name: name,
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to send invitation");
        }

        const result = await response.json();

        return {
            response: {
                membershipId: result.$id,
                userId: result.userId,
            },
            status: 201,
            success: true,
            message: `Invitation sent to ${email}. They'll receive an email to join the team.`,
        };
    } catch (error) {
        console.error("Error inviting player by email:", error);

        return {
            success: false,
            status: error.code || 500,
            message: error.message || "Failed to send invitation",
        };
    }
}

/**
 * CLIENT-SIDE ACTION
 * Accept a team invitation using the Client SDK
 * This must use Client SDK because updateMembershipStatus requires public scope
 */
export async function acceptTeamInvitation({
    teamId,
    membershipId,
    userId,
    secret,
}) {
    try {
        const { Client, Teams } = await import("appwrite");
        const client = new Client()
            .setEndpoint(import.meta.env.VITE_APPWRITE_HOST_URL)
            .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

        const teams = new Teams(client);

        // Accept the invitation - this creates a session for the user
        // Note: Using positional params like createMembership
        const membership = await teams.updateMembershipStatus(
            teamId,
            membershipId,
            userId,
            secret,
        );

        return {
            success: true,
            inviteAccepted: true,
            email: membership.userEmail,
            name: membership.userName,
        };
    } catch (error) {
        console.error("Error accepting invitation:", error);

        // If membership is already confirmed, redirect to team page
        if (error.message && error.message.includes("already confirmed")) {
            return {
                success: true,
                inviteAccepted: true,
                alreadyConfirmed: true,
            };
        }

        return {
            success: false,
            message:
                error.message ||
                "Failed to accept invitation. The link may have expired.",
        };
    }
}

/**
 * Set password for a new user who was invited to a team
 * This is a SERVER-SIDE action
 */
export async function setPasswordForInvitedUser({ userId, email, password }) {
    const { Users } = await import("node-appwrite");
    const { createAdminClient } = await import("@/utils/appwrite/server");
    const cookie = await import("cookie");

    if (!password || password.length < 8) {
        return {
            success: false,
            message: "Password must be at least 8 characters long",
        };
    }

    try {
        const { account } = createAdminClient();
        const users = new Users(account.client);

        // Update the user's password
        await users.updatePassword({ userId, password });

        // Create a session for the user using Server SDK
        const session = await account.createSession(userId);

        // Set the session cookie
        const sessionCookie = cookie.serialize(
            "appwrite-session",
            session.secret,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365, // 1 year
                path: "/",
            },
        );

        return new Response(null, {
            status: 302,
            headers: {
                "Set-Cookie": sessionCookie,
                Location: "/teams",
            },
        });
    } catch (error) {
        console.error("Error setting password:", error);
        return {
            success: false,
            message:
                error.message || "Failed to set password. Please try again.",
        };
    }
}
