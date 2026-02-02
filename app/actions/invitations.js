/**
 * CLIENT-SIDE ACTION
 * Invite a player to join a team by email using Appwrite Teams API
 *
 * Uses direct fetch to Appwrite REST API with X-Appwrite-Session header.
 * This bypasses the SDK's cookie handling which conflicts with our SSR session management.
 * Appwrite automatically handles user lookup, account creation, and email sending.
 */
export async function invitePlayerByEmail({
    email,
    teamId,
    name,
    url,
    sessionProp,
}) {
    try {
        let session = sessionProp;

        // Fetch the session from our server API if not provided
        if (!session) {
            const sessionResponse = await fetch("/api/session");
            if (!sessionResponse.ok) {
                throw new Error("Failed to retrieve session");
            }
            const data = await sessionResponse.json();
            session = data.session;
        }

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
                    email,
                    url,
                    name,
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
 * Bulk invite players by email
 * Wrapper around invitePlayerByEmail to handle multiple invites
 */
export async function invitePlayers({ players, teamId, url }) {
    // Fetch session once to reuse across all requests (with retry)
    let session = null;

    const sleep = (ms) =>
        new Promise((resolve) => {
            setTimeout(resolve, ms);
        });

    const fetchSessionWithRetry = async ({
        maxAttempts = 3,
        initialDelayMs = 200,
    } = {}) => {
        let delayMs = initialDelayMs;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            try {
                const sessionResponse = await fetch("/api/session");
                if (!sessionResponse.ok) {
                    throw new Error(
                        `Failed to retrieve session (status ${sessionResponse.status})`,
                    );
                }

                const data = await sessionResponse.json();

                if (!data || !data.session) {
                    throw new Error("Session data missing in response");
                }

                return data.session;
            } catch (error) {
                if (attempt === maxAttempts - 1) {
                    throw error;
                }

                // Exponential backoff before next attempt
                await sleep(delayMs);
                delayMs *= 2;
            }
        }

        throw new Error("Unable to retrieve session after retries");
    };

    try {
        session = await fetchSessionWithRetry();
    } catch (error) {
        console.error(
            "Failed to pre-fetch session for bulk invite after retries:",
            error,
        );
        return {
            success: false,
            message:
                "Failed to retrieve session. No invitations were sent. Please try again.",
        };
    }

    const results = await Promise.allSettled(
        players.map((player) =>
            invitePlayerByEmail({
                email: player.email,
                name: player.name,
                teamId,
                url,
                sessionProp: session,
            }),
        ),
    );

    const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
    );
    const failed = results.filter(
        (r) => r.status === "rejected" || (r.value && !r.value.success),
    );

    if (failed.length === 0) {
        return {
            success: true,
            message: `Successfully invited ${successful.length} player${successful.length !== 1 ? "s" : ""}`,
        };
    }

    if (successful.length === 0) {
        return {
            success: false,
            message: "Failed to send any invitations",
            errors: failed.map(
                (f) =>
                    f.reason?.message ||
                    f.value?.message ||
                    "Unknown error occurred",
            ),
        };
    }

    // Partial success
    return {
        success: true, // We return true so we can close the modal, but show a warning
        message: `Invited ${successful.length} player${successful.length !== 1 ? "s" : ""}. Failed to invite ${failed.length}.`,
        warning: true,
    };
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
export async function setPasswordForInvitedUser({
    userId,
    email,
    password,
    name,
}) {
    const { Users } = await import("node-appwrite");
    const { createAdminClient } = await import("@/utils/appwrite/server");
    const { createDocument, readDocument } = await import("@/utils/databases");
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

        // Check if user document already exists in the users collection
        let userDocExists = false;
        try {
            await readDocument("users", userId);
            userDocExists = true;
        } catch (error) {
            // Document doesn't exist, we'll create it
            userDocExists = false;
        }

        // Create user document in users collection if it doesn't exist
        // This ensures the Auth user ID matches the users collection document ID
        if (!userDocExists) {
            // Parse name into first/last if provided
            let firstName = "";
            let lastName = "";
            if (name) {
                const nameParts = name.trim().split(" ");
                firstName = nameParts[0] || "";
                lastName = nameParts.slice(1).join(" ") || "";
            }

            await createDocument("users", userId, {
                email,
                firstName,
                lastName,
                userId, // Store the Auth userId for reference
                preferredPositions: [],
                dislikedPositions: [],
            });
        }

        // Create a session for the user using Users API (Server SDK)
        const session = await users.createSession(userId);

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
                Location: "/",
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

/**
 * SERVER-SIDE ACTION
 * Invite players to a team.
 * Hybrid approach:
 * - If user exists in project: Automatically add them to team (Admin Client)
 * - If user is new: Send invitation email (Session Client -> simulated via fetch)
 *
 * Why this complexity?
 * 1. Appwrite Server SDK's `createMembership` behaves differently depending on the context.
 *    - With API Key (Admin): Adds user immediately to team (no invite email for existing users).
 *    - With Session Client: Sends an invite email.
 * 2. We want to AUTO-ADD existing users (better UX), but EMAIL new users.
 * 3. `invitePlayers` ran on client-side, but failed for existing users because they
 *    couldn't be auto-added without Admin privileges or specific flow.
 *
 * Solution:
 * - Run on Server.
 * - Verify permissions manually (since we elevate privileges later).
 * - Check if user exists using Admin Client.
 * - IF EXISTS: Add to team using Admin Client (bypasses invite, auto-joins).
 * - IF NEW: Call `invitePlayerByEmail` (simulated client fetch) to ensure Appwrite
 *   sends the standard invitation email.
 */
export async function invitePlayersServer({ players, teamId, url, request }) {
    const { Query } = await import("node-appwrite");
    const { createSessionClient, createAdminClient, parseSessionCookie } =
        await import("@/utils/appwrite/server");

    // 1. Verify permissions
    const { teams: sessionTeams, account: sessionAccount } =
        await createSessionClient(request);

    try {
        // Get current user details
        const user = await sessionAccount.get();

        // Check user's membership in the target team
        // We use listMemberships with a query to find the specific user's membership
        const membershipList = await sessionTeams.listMemberships(teamId, [
            Query.equal("userId", user.$id),
        ]);

        const membership =
            membershipList.total > 0 ? membershipList.memberships[0] : null;
        const isOwner = membership?.roles?.includes("owner") || false;

        if (!membership || !isOwner) {
            return {
                success: false,
                message:
                    "You do not have permission to invite players to this team.",
            };
        }
    } catch (error) {
        console.error("Permission check failed:", error);
        return {
            success: false,
            message: "Failed to verify permissions. Please try again.",
        };
    }

    const { teams: adminTeams, users: adminUsers } = createAdminClient();
    const session = parseSessionCookie(request.headers.get("Cookie"));

    const processPlayer = async (player) => {
        const { email, name } = player;

        try {
            // Check if user exists in the project
            // We use Admin Client to search all users
            const userList = await adminUsers.list([
                Query.equal("email", email),
            ]);

            const existingUser = userList.total > 0 ? userList.users[0] : null;

            if (existingUser) {
                // User exists - Add them directly (Auto-join)
                // First check if they are already in the team to avoid 409
                try {
                    const membershipList = await adminTeams.listMemberships(
                        teamId,
                        [Query.equal("userId", existingUser.$id)],
                    );

                    if (membershipList.total > 0) {
                        const membership = membershipList.memberships[0];
                        if (membership.confirm) {
                            return {
                                success: false,
                                reason: "Player is already a member",
                            };
                        } else {
                            return {
                                success: false,
                                reason: "Player has already been invited",
                            };
                        }
                    }

                    // Add to team
                    await adminTeams.createMembership(
                        teamId,
                        ["player"],
                        undefined, // email (not needed if userId provided)
                        existingUser.$id,
                    );

                    return { success: true, message: "Added to team" };
                } catch (addError) {
                    throw new Error(
                        addError.message || "Failed to add existing user",
                    );
                }
            } else {
                // User does not exist - Send invite via Client API (simulated)
                // We use the raw fetch method to ensure Appwrite treats this as a
                // client-side invite and sends the email.
                // Using the Server SDK (even with user session) might be treated as
                // a server operation which suppresses emails in some contexts.
                const result = await invitePlayerByEmail({
                    email,
                    teamId,
                    name,
                    url,
                    sessionProp: session,
                });

                if (result.success) {
                    return { success: true, message: "Invitation sent" };
                } else {
                    return { success: false, reason: result.message };
                }
            }
        } catch (error) {
            // Return failure for this player
            return { success: false, reason: error.message };
        }
    };

    const results = await Promise.allSettled(players.map(processPlayer));

    const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
    );
    const failed = results.filter(
        (r) => r.status === "rejected" || (r.value && !r.value.success),
    );

    // Format response consistent with invitePlayers
    if (failed.length === 0) {
        return {
            success: true,
            message: `Successfully invited/added ${successful.length} player${successful.length !== 1 ? "s" : ""}`,
        };
    }

    if (successful.length === 0) {
        const firstError =
            failed[0].value?.reason ||
            failed[0].reason?.message ||
            "Unknown error";
        return {
            success: false,
            message: "Failed to invite players",
            errors: failed.map(
                (f) => f.value?.reason || f.reason?.message || "Unknown error",
            ),
        };
    }

    // Partial success
    return {
        success: true,
        message: `Processed ${successful.length} player${successful.length !== 1 ? "s" : ""}. Failed: ${failed.length}.`,
        warning: true,
    };
}
