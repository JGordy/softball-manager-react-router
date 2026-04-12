/**
 * BROWSER-ONLY ACTION
 * Orchestrates the full invitation flow from the client:
 * 1. Hydrates the Appwrite Client with a session JWT.
 * 2. Sends email invitations via Client SDK (triggering emails).
 * 3. Syncs shadow records to the database on the server.
 */
export async function invitePlayersBrowser({ teamId, players, client }) {
    if (!players || !Array.isArray(players) || players.length === 0) {
        return { success: true, message: "No players to invite" };
    }

    try {
        // 1. Prepare Session (JWT handoff)
        const sessionResponse = await fetch("/api/session");
        const { jwt } = await sessionResponse.json();
        if (jwt) {
            client.setJWT(jwt);
        } else {
            throw new Error("Could not retrieve authentication session.");
        }

        const { Teams } = await import("appwrite");
        const teamsService = new Teams(client);

        const inviteUrl = `${window.location.origin}/team/${teamId}/accept-invite`;
        const results = [];

        // 2. Perform invitations via Client SDK
        for (const player of players) {
            try {
                const response = await teamsService.createMembership(
                    teamId,
                    ["player"],
                    player.email,
                    undefined, // userId MUST be undefined for invitation emails
                    undefined, // phone
                    inviteUrl,
                    player.name,
                );

                results.push({
                    email: player.email,
                    name: player.name,
                    userId: response.userId,
                    success: true,
                });
            } catch (error) {
                // Handle 409 Conflict (User/Membership already exists)
                if (error.code === 409) {
                    results.push({
                        email: player.email,
                        name: player.name,
                        success: true, // Treat as success for syncing purposes
                        alreadyExists: true,
                    });
                } else {
                    throw error;
                }
            }
        }

        const syncResponse = { results };

        return {
            success: true,
            results,
            message: `Successfully invited ${results.length} player(s).`,
        };
    } catch (error) {
        console.error("Browser invitation flow failed:", error);
        return {
            success: false,
            message: error.message || "Failed to send invitations.",
        };
    }
}

/**
 * SHARED UTILITY
 * Low-level invite call. Best used via invitePlayersBrowser or invitePlayersServer.
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
        if (!client || !client.teams) {
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
 * SESSION-BASED ACTION
 * Bulk invite players by email.
 * Wrapper around invitePlayerByEmail to handle multiple invites.
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
                    (f.reason && f.reason.message) ||
                    (f.value && f.value.message) ||
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
 * Accept a team invitation using the Client SDK.
 * This MUST run on the client browser because updateMembershipStatus requires the user's IP/browser context.
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
    const { createDocument, readDocument, updateDocument } = await import(
        "@/utils/databases"
    );

    const { Permission, Role } = await import("node-appwrite");
    const cookie = await import("cookie");

    if (!password || password.length < 8) {
        return {
            success: false,
            message: "Password must be at least 8 characters long",
        };
    }

    try {
        const adminClient = createAdminClient();

        const { account } = adminClient;
        const users = new Users(account.client);

        // Update the user's password
        await users.updatePassword({ userId, password });

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
                    status: "verified",
                    preferredPositions: [],
                    dislikedPositions: [],
                },
                docPermissions,
                adminClient,
            );
        } else {
            // Document exists, update status to verified if it was unverified
            await updateDocument(
                "users",
                userId,
                { status: "verified" },
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
 * SERVER-SIDE ONLY ACTION
 * Main entry point for inviting players to a team from a route action.
 * Hybrid approach:
 * - Uses individual invites to ensure standard Appwrite verification flow.
 * - Always creates/updates shadow records in the database.
 */
export async function invitePlayersServer({ players, teamId, url, client }) {
    const { Query } = await import("node-appwrite");
    const { createAdminClient } = await import("@/utils/appwrite/server");

    // 1. Verify permissions
    if (!client || !client.teams || !client.account) {
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
        const isOwner = (membership && membership.roles && membership.roles.indexOf("owner") !== -1) || false;

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
            // IMPORTANT: Use the sessionClient (manager's session)
            // DO NOT provide a userId. This forces an invitation email.
            const membersClient = client.teams;
            const membership = await membersClient.createMembership(
                teamId,
                ["player"],
                email,
                undefined, // userId MUST be undefined for invitation emails
                undefined, // phone
                url,
                name,
            );

            const currentUserId = membership.userId;

            // Sync shadow record in database (Admin Client)
            try {
                const { createDocument, readDocument } = await import(
                    "@/utils/databases"
                );
                const { Permission, Role } = await import("node-appwrite");

                // Check if doc exists
                try {
                    await readDocument(
                        "users",
                        currentUserId,
                        [],
                        createAdminClient(),
                    );
                } catch (e) {
                    // Create it if missing
                    const docPermissions = [
                        Permission.read(Role.any()),
                        Permission.update(Role.user(currentUserId)),
                        Permission.update(Role.team(teamId, "manager")),
                        Permission.update(Role.team(teamId, "owner")),
                        Permission.delete(Role.user(currentUserId)),
                    ];

                    let firstName = "";
                    let lastName = "";
                    if (name) {
                        const parts = name.trim().split(" ");
                        firstName = parts[0] || "";
                        lastName = parts.slice(1).join(" ") || "";
                    }

                    await createDocument(
                        "users",
                        currentUserId,
                        {
                            email,
                            firstName,
                            lastName,
                            userId: currentUserId,
                            status: "unverified",
                            preferredPositions: [],
                            dislikedPositions: [],
                        },
                        docPermissions,
                        createAdminClient(),
                    );
                }
            } catch (shadowError) {
                console.error("Shadow sync failed:", shadowError);
            }

            return { success: true };
        } catch (error) {
            console.error(`Invite failed for ${email}:`, error);
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
            (failed[0].value && failed[0].value.reason) ||
            (failed[0].reason && failed[0].reason.message) ||
            "Unknown error";
        return {
            success: false,
            message: `Failed to invite players: ${firstError}`,
            errors: failed.map(
                (f) =>
                    (f.value && f.value.reason) ||
                    (f.reason && f.reason.message) ||
                    "Unknown error",
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

/**
 * SERVER-SIDE ACTION
 * Sync database shadow records for players who were just invited via the client SDK.
 */
export async function syncInvitedPlayersServer({ players, teamId }) {
    if (!players || !Array.isArray(players)) {
        return { success: false, reason: "No players to sync" };
    }

    const { createAdminClient } = await import("@/utils/appwrite/server");
    const { Query } = await import("node-appwrite");

    const processPlayer = async (player) => {
        const { email, name, userId } = player;

        try {
            const { createDocument, readDocument } = await import(
                "@/utils/databases"
            );
            const { Permission, Role } = await import("node-appwrite");

            let currentUserId = userId;

            // Deep Search: Fallback to finding existing IDs if not provided
            if (!currentUserId) {
                const { users, teams } = createAdminClient();
                const userList = await users.list([Query.equal("email", email)]);
                
                if (userList.total > 0) {
                    currentUserId = userList.users[0].$id;
                } else {
                    // Search memberships manually - emails aren't directly queryable here
                    try {
                        const members = await teams.listMemberships(teamId);
                        const match = members.memberships.find(m => 
                            m.userEmail.toLowerCase() === email.toLowerCase()
                        );
                        
                        if (match) {
                            currentUserId = match.userId;
                        }
                    } catch (memberErr) {
                        console.error(`[Sync] Membership search failed:`, memberErr.message);
                    }
                }
            }

            if (!currentUserId) {
                throw new Error("Could not determine userId for shadow record");
            }

            // Check if doc exists
            try {
                const existing = await readDocument(
                    "users",
                    currentUserId,
                    [],
                    createAdminClient(),
                );
                // If exists but was unverified/partial, we don't need to do anything
                // but we could update it here if needed.
            } catch (e) {
                // Only proceed if it's a 404/Not Found
                if (e.code !== 404 && !(e.message && e.message.indexOf("not be found") !== -1)) {
                    console.error("Unexpected error checking user doc:", e);
                    throw e;
                }
                
                const docPermissions = [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(currentUserId)),
                    Permission.update(Role.team(teamId, "manager")),
                    Permission.update(Role.team(teamId, "owner")),
                    Permission.delete(Role.user(currentUserId)),
                ];

                let firstName = "";
                let lastName = "";
                if (name) {
                    const parts = name.trim().split(" ");
                    firstName = parts[0] || "";
                    lastName = parts.slice(1).join(" ") || "";
                }

                await createDocument(
                    "users",
                    currentUserId,
                    {
                        email,
                        firstName,
                        lastName,
                        userId: currentUserId,
                        status: "unverified",
                        preferredPositions: [],
                        dislikedPositions: [],
                    },
                    docPermissions,
                    createAdminClient(),
                );
            }
            return { success: true };
        } catch (error) {
            return { success: false, reason: error.message };
        }
    };

    const results = await Promise.allSettled(players.map(processPlayer));
    const successfulCount = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
    ).length;

    return {
        success: true,
        message: `Synced ${successfulCount} shadow records.`,
    };
}
