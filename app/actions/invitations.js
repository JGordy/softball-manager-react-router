/**
 * CLIENT-SIDE ACTION
 * Invite a player to join a team by email using Appwrite Teams API
 *
 * Uses injected `client.teams` API directly exposing Server Actions dynamically.
 * Appwrite automatically handles user lookup, account creation, and email sending.
 */
export async function invitePlayerByEmail({
    email,
    teamId,
    name,
    url,
    roles = ["player"],
    client,
}) {
    try {
        if (!client?.teams) {
            throw new Error(
                "Missing or invalid Appwrite client provided to invitePlayerByEmail.",
            );
        }
        const teamsClient = client.teams;

        const membership = await teamsClient.createMembership(
            teamId,
            roles,
            email,
            undefined, // userId
            undefined, // phone
            url,
            name,
        );

        return {
            response: {
                membershipId: membership.$id,
                userId: membership.userId,
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
export async function invitePlayers({ players, teamId, url, client }) {
    if (!players || !Array.isArray(players) || players.length === 0) {
        return {
            success: true,
            message: "Successfully invited 0 players",
        };
    }

    const results = await Promise.allSettled(
        players.map((player) =>
            invitePlayerByEmail({
                email: player.email,
                name: player.name,
                teamId,
                url,
                client,
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

    const { Permission, Role } = await import("node-appwrite");
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

        const adminClient = createAdminClient();

        // Check if user document already exists in the users collection
        let userDocExists = false;
        try {
            await readDocument("users", userId, [], adminClient);
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

            const docPermissions = [
                Permission.read(Role.any()),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ];

            await createDocument(
                "users",
                userId,
                {
                    email,
                    firstName,
                    lastName,
                    userId, // Store the Auth userId for reference
                    preferredPositions: [],
                    dislikedPositions: [],
                },
                docPermissions,
                adminClient,
            );
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
 * - If user is new: Send invitation email (Session Client)
 */
export async function invitePlayersServer({ players, teamId, url, client }) {
    const { Query } = await import("node-appwrite");
    const { createAdminClient } = await import("@/utils/appwrite/server");

    // 1. Verify permissions
    if (!client?.teams || !client?.account) {
        return {
            success: false,
            message:
                "Missing or invalid Appwrite client provided to invitePlayersServer.",
        };
    }
    const { teams: sessionTeams, account: sessionAccount } = client;

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
                const result = await invitePlayerByEmail({
                    email,
                    teamId,
                    name,
                    url,
                    client,
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
            message: `Failed to invite players: ${firstError}`,
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
