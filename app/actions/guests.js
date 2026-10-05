import { Query, Permission, Role } from "node-appwrite";
import {
    createDocument,
    deleteDocument,
    listDocuments,
    readDocument,
    updateDocument,
} from "@/utils/databases";
import { createAdminClient } from "@/utils/appwrite/server";
import { verifyManager } from "@/actions/utils/teamAuth";
import { addPlayersToSeasonRoster } from "@/actions/rosterHistory";
import { parsePlayerChart } from "@/routes/gameday/utils/gamedayUtils";

/**
 * Converts a temporary guest player into a full team member.
 * Attributes all previous game logs, lineups, and stats to the new user ID,
 * creates or updates the user shadow document, and enrolls them into active season rosters.
 *
 * @param {object} params
 * @param {string} params.guestPlayerId - ID of the temporary guest user document.
 * @param {string} params.teamId - Team ID to invite the player into.
 * @param {string} params.email - Player's email address.
 * @param {string} [params.firstName] - Player's first name.
 * @param {string} [params.lastName] - Player's last name.
 * @param {string} [params.gender] - Player's gender (Male/Female).
 * @param {string} [params.newUserId] - The invited user's Appwrite user ID.
 * @param {object} params.client - The session Appwrite client (manager's session).
 * @returns {Promise<{success: boolean, message: string, status?: number, player?: object}>}
 */
export async function convertGuestToMember({
    guestPlayerId,
    teamId,
    email,
    firstName,
    lastName,
    gender,
    newUserId: initialNewUserId,
    client,
}) {
    if (!guestPlayerId || !teamId || !email) {
        return {
            success: false,
            status: 400,
            message: "Guest player ID, team ID, and email are required.",
        };
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
        return {
            success: false,
            status: 400,
            message: "A valid email address is required.",
        };
    }

    // 1. Authorization: verify manager/owner role
    const authCheck = await verifyManager(teamId, client);
    if (!authCheck.success) {
        return {
            success: false,
            status: 403,
            message: authCheck.message || "Unauthorized to manage players.",
        };
    }

    const adminClient = createAdminClient();

    try {
        // 2. Fetch the guest document to retain existing data if not provided
        let guestDoc = null;
        try {
            guestDoc = await readDocument(
                "users",
                guestPlayerId,
                [],
                adminClient,
            );
        } catch (_err) {
            console.warn(
                `[convertGuestToMember] Could not read guest document: ${guestPlayerId}`,
            );
        }

        const resolvedFirstName = (
            firstName ||
            guestDoc?.firstName ||
            ""
        ).trim();
        const resolvedLastName = (lastName || guestDoc?.lastName || "").trim();
        const resolvedGender = gender || guestDoc?.gender || "Male";
        const fullName = `${resolvedFirstName} ${resolvedLastName}`.trim();

        // 3. Resolve user ID for the invited/existing player
        let newUserId = initialNewUserId;
        if (!newUserId) {
            const userList = await adminClient.users.list([
                Query.equal("email", trimmedEmail),
                Query.limit(1),
            ]);
            if (userList.users.length > 0) {
                newUserId = userList.users[0].$id;
            } else {
                try {
                    const members =
                        await adminClient.teams.listMemberships(teamId);
                    const match = members.memberships.find(
                        (m) => m.userEmail.toLowerCase() === trimmedEmail,
                    );
                    if (match) {
                        newUserId = match.userId;
                    }
                } catch (_membershipErr) {
                    // Fall through to error
                }
            }
        }

        if (!newUserId) {
            return {
                success: false,
                status: 400,
                message: "Could not determine user ID for the invited player.",
            };
        }

        // 4. Create or update permanent user shadow document
        let existingUserDoc = null;
        try {
            existingUserDoc = await readDocument(
                "users",
                newUserId,
                [],
                adminClient,
            );
        } catch (_e) {
            existingUserDoc = null;
        }

        if (!existingUserDoc) {
            const docPermissions = [
                Permission.read(Role.any()),
                Permission.update(Role.user(newUserId)),
                Permission.update(Role.team(teamId, "manager")),
                Permission.update(Role.team(teamId, "owner")),
                Permission.delete(Role.user(newUserId)),
            ];

            await createDocument(
                "users",
                newUserId,
                {
                    email: trimmedEmail,
                    firstName: resolvedFirstName,
                    lastName: resolvedLastName,
                    gender: resolvedGender,
                    userId: newUserId,
                    status: "unverified",
                    isTemporary: false,
                    preferredPositions: guestDoc?.preferredPositions || [],
                    dislikedPositions: guestDoc?.dislikedPositions || [],
                },
                docPermissions,
                adminClient,
            );
        } else {
            await updateDocument(
                "users",
                newUserId,
                {
                    gender: existingUserDoc.gender || resolvedGender,
                    isTemporary: false,
                },
                adminClient,
            );
        }

        // 5. Re-attribute game_logs from guestPlayerId -> newUserId
        try {
            const logsResponse = await listDocuments(
                "game_logs",
                [Query.equal("playerId", guestPlayerId), Query.limit(500)],
                adminClient,
            );
            const logs = logsResponse.rows || [];
            for (const log of logs) {
                await updateDocument(
                    "game_logs",
                    log.$id,
                    { playerId: newUserId },
                    adminClient,
                );
            }
        } catch (logsError) {
            console.error(
                "[convertGuestToMember] Error migrating game_logs:",
                logsError,
            );
        }

        // 6. Re-attribute playerChart occurrences in team games
        let seasonsResponse;
        try {
            seasonsResponse = await listDocuments(
                "seasons",
                [Query.equal("teamId", teamId), Query.limit(100)],
                adminClient,
            );
            const seasonIds = (seasonsResponse.rows || []).map((s) => s.$id);

            let teamGames = [];
            if (seasonIds.length > 0) {
                const gamesResponse = await listDocuments(
                    "games",
                    [Query.equal("seasons", seasonIds), Query.limit(150)],
                    adminClient,
                );
                teamGames = gamesResponse.rows || [];
            }

            for (const game of teamGames) {
                if (!game.playerChart) continue;
                const parsedChart = parsePlayerChart(game.playerChart);
                if (!Array.isArray(parsedChart)) continue;

                let chartModified = false;
                const updatedChart = parsedChart.map((slot) => {
                    if (!slot || typeof slot !== "object") return slot;
                    let slotModified = false;
                    const newSlot = { ...slot };

                    if (newSlot.$id === guestPlayerId) {
                        newSlot.$id = newUserId;
                        newSlot.firstName = resolvedFirstName;
                        newSlot.lastName = resolvedLastName;
                        slotModified = true;
                    }

                    if (Array.isArray(newSlot.substitutions)) {
                        const newSubs = newSlot.substitutions.map((sub) => {
                            if (sub?.playerId === guestPlayerId) {
                                slotModified = true;
                                return { ...sub, playerId: newUserId };
                            }
                            return sub;
                        });
                        if (slotModified) {
                            newSlot.substitutions = newSubs;
                        }
                    }

                    if (slotModified) chartModified = true;
                    return newSlot;
                });

                if (chartModified) {
                    await updateDocument(
                        "games",
                        game.$id,
                        { playerChart: JSON.stringify(updatedChart) },
                        adminClient,
                    );
                }
            }
        } catch (gamesError) {
            console.error(
                "[convertGuestToMember] Error migrating game playerCharts:",
                gamesError,
            );
        }

        // 7. Clean up old guest records
        const currentYear = String(new Date().getFullYear());
        await deleteDocument(
            "user_stats_summary",
            `${guestPlayerId}_${currentYear}`,
            adminClient,
        ).catch(() => null);
        await deleteDocument(
            "user_stats_summary",
            `${guestPlayerId}_master`,
            adminClient,
        ).catch(() => null);

        if (guestPlayerId !== newUserId) {
            try {
                await deleteDocument("users", guestPlayerId, adminClient);
            } catch (deleteErr) {
                console.warn(
                    "[convertGuestToMember] Failed to delete guest user doc:",
                    deleteErr,
                );
            }
        }

        // 8. Auto-add newUserId to active season rosters
        try {
            const activeSeasons = (seasonsResponse?.rows || []).filter((s) => {
                if (!s.endDate) return true;
                return (
                    s.endDate.split("T")[0] >=
                    new Date().toISOString().split("T")[0]
                );
            });

            if (activeSeasons.length > 0) {
                await Promise.all(
                    activeSeasons.map((season) =>
                        addPlayersToSeasonRoster({
                            playerIds: [newUserId],
                            teamId,
                            seasonId: season.$id,
                            client: adminClient,
                        }),
                    ),
                );
            }
        } catch (seasonErr) {
            console.error(
                "[convertGuestToMember] Auto-adding to active seasons failed:",
                seasonErr,
            );
        }

        return {
            success: true,
            status: 200,
            message: `Successfully invited ${fullName || trimmedEmail} and linked their past stats.`,
            player: {
                $id: newUserId,
                userId: newUserId,
                firstName: resolvedFirstName,
                lastName: resolvedLastName,
                gender: resolvedGender,
                email: trimmedEmail,
                status: "unverified",
            },
        };
    } catch (error) {
        console.error("[convertGuestToMember] Unexpected error:", error);
        return {
            success: false,
            status: 500,
            message: error.message || "Failed to convert guest player.",
        };
    }
}
