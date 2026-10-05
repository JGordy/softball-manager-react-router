import { Query } from "node-appwrite";
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
 * Sends an Appwrite team invitation by email, links all previous game logs,
 * lineups, and stats to the new user ID, and enrolls them into active season rosters.
 *
 * @param {object} params
 * @param {string} params.guestPlayerId - ID of the temporary guest user document.
 * @param {string} params.teamId - Team ID to invite the player into.
 * @param {string} params.email - Player's email address.
 * @param {string} [params.firstName] - Player's first name.
 * @param {string} [params.lastName] - Player's last name.
 * @param {string} [params.gender] - Player's gender (Male/Female).
 * @param {object} params.client - The session Appwrite client (manager's session).
 * @param {string} [params.requestUrl] - Base request URL for building the invite link.
 * @returns {Promise<{success: boolean, message: string, status?: number, player?: object}>}
 */
export async function convertGuestToMember({
    guestPlayerId,
    teamId,
    email,
    firstName,
    lastName,
    gender,
    client,
    requestUrl,
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
            message: authCheck.message || "Unauthorized to invite players.",
        };
    }

    const adminClient = createAdminClient();

    try {
        // 2. Fetch the guest document to retain existing data
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

        // 3. Send Appwrite Team invitation via sessionClient
        let newUserId = null;
        const urlOrigin = requestUrl ? new URL(requestUrl).origin : "";
        const inviteUrl = urlOrigin
            ? `${urlOrigin}/team/${teamId}/accept-invite`
            : `/team/${teamId}/accept-invite`;

        try {
            const membership = await client.teams.createMembership(
                teamId,
                ["player"],
                trimmedEmail,
                undefined, // userId MUST be undefined for Appwrite to send invite email
                undefined, // phone
                inviteUrl,
                fullName || undefined,
            );
            newUserId = membership.userId;
        } catch (inviteError) {
            // Handle 409 Conflict: user is already a member of this team
            if (inviteError.code === 409) {
                // Find existing user ID by email
                const userList = await adminClient.users.list([
                    Query.equal("email", trimmedEmail),
                    Query.limit(1),
                ]);
                if (userList.users.length > 0) {
                    newUserId = userList.users[0].$id;
                } else {
                    return {
                        success: false,
                        status: 409,
                        message:
                            "Player with this email already belongs to this team.",
                    };
                }
            } else {
                console.error(
                    "[convertGuestToMember] createMembership failed:",
                    inviteError,
                );
                return {
                    success: false,
                    status: inviteError.code || 500,
                    message:
                        inviteError.message ||
                        "Failed to send team invitation.",
                };
            }
        }

        if (!newUserId) {
            return {
                success: false,
                status: 500,
                message: "Could not determine user ID for the invited player.",
            };
        }

        // 4. Create or update permanent user shadow document
        const { Permission, Role } = await import("node-appwrite");
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
            // Document already exists, ensure it's not marked temporary and preserve/update fields
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

        // 6. Re-attribute playerChart occurrences in games
        try {
            // Find games for team's seasons
            const seasonsResponse = await listDocuments(
                "seasons",
                [Query.equal("teamId", teamId), Query.limit(100)],
                adminClient,
            );
            const seasonIds = (seasonsResponse.rows || []).map((s) => s.$id);

            let teamGames = [];
            if (seasonIds.length > 0) {
                const gamesResponse = await listDocuments(
                    "games",
                    [Query.equal("seasons", seasonIds), Query.limit(100)],
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

        // 7. Re-attribute user_stats_summary
        try {
            const currentYear = String(new Date().getFullYear());
            const oldYearDocId = `${guestPlayerId}_${currentYear}`;
            const oldMasterDocId = `${guestPlayerId}_master`;

            const oldYearSummary = await readDocument(
                "user_stats_summary",
                oldYearDocId,
                [],
                adminClient,
            ).catch(() => null);

            const oldMasterSummary = await readDocument(
                "user_stats_summary",
                oldMasterDocId,
                [],
                adminClient,
            ).catch(() => null);

            // Function to merge summary into new user doc
            const mergeSummary = async (oldDoc, targetDocId, yearValue) => {
                if (!oldDoc) return;
                const newDoc = await readDocument(
                    "user_stats_summary",
                    targetDocId,
                    [],
                    adminClient,
                ).catch(() => null);

                const baseDoc = newDoc || {
                    userId: newUserId,
                    year: yearValue,
                    hits: 0,
                    ab: 0,
                    tb: 0,
                    rbi: 0,
                    runs: 0,
                    doubles: 0,
                    triples: 0,
                    homeruns: 0,
                    walks: 0,
                    strikeouts: 0,
                    sf: 0,
                    gameCount: 0,
                    avg: 0,
                    slg: 0,
                    ops: 0,
                };

                const merged = {
                    ...baseDoc,
                    userId: newUserId,
                    year: yearValue,
                    hits: (baseDoc.hits || 0) + (oldDoc.hits || 0),
                    ab: (baseDoc.ab || 0) + (oldDoc.ab || 0),
                    tb: (baseDoc.tb || 0) + (oldDoc.tb || 0),
                    rbi: (baseDoc.rbi || 0) + (oldDoc.rbi || 0),
                    runs: (baseDoc.runs || 0) + (oldDoc.runs || 0),
                    doubles: (baseDoc.doubles || 0) + (oldDoc.doubles || 0),
                    triples: (baseDoc.triples || 0) + (oldDoc.triples || 0),
                    homeruns: (baseDoc.homeruns || 0) + (oldDoc.homeruns || 0),
                    walks: (baseDoc.walks || 0) + (oldDoc.walks || 0),
                    strikeouts:
                        (baseDoc.strikeouts || 0) + (oldDoc.strikeouts || 0),
                    sf: (baseDoc.sf || 0) + (oldDoc.sf || 0),
                    gameCount:
                        (baseDoc.gameCount || 0) + (oldDoc.gameCount || 0),
                };

                const totalAb = merged.ab || 0;
                const totalHits = merged.hits || 0;
                const totalTb = merged.tb || 0;
                merged.avg =
                    totalAb > 0
                        ? parseFloat((totalHits / totalAb).toFixed(3))
                        : 0;
                merged.slg =
                    totalAb > 0
                        ? parseFloat((totalTb / totalAb).toFixed(3))
                        : 0;
                merged.ops = parseFloat((merged.avg + merged.slg).toFixed(3));

                if (newDoc) {
                    await updateDocument(
                        "user_stats_summary",
                        targetDocId,
                        merged,
                        adminClient,
                    );
                } else {
                    await createDocument(
                        "user_stats_summary",
                        targetDocId,
                        merged,
                        [],
                        adminClient,
                    );
                }
            };

            await mergeSummary(
                oldYearSummary,
                `${newUserId}_${currentYear}`,
                currentYear,
            );
            await mergeSummary(
                oldMasterSummary,
                `${newUserId}_master`,
                "master",
            );

            // Clean up old guest summary docs
            if (oldYearSummary) {
                await deleteDocument(
                    "user_stats_summary",
                    oldYearDocId,
                    adminClient,
                ).catch(() => null);
            }
            if (oldMasterSummary) {
                await deleteDocument(
                    "user_stats_summary",
                    oldMasterDocId,
                    adminClient,
                ).catch(() => null);
            }
        } catch (summaryError) {
            console.error(
                "[convertGuestToMember] Error migrating user_stats_summary:",
                summaryError,
            );
        }

        // 8. Delete the old temporary guest document if it's different from newUserId
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

        // 9. Auto-add newUserId to active season rosters
        try {
            const seasonsResponse = await listDocuments(
                "seasons",
                [Query.equal("teamId", teamId), Query.limit(100)],
                adminClient,
            );
            const activeSeasons = seasonsResponse.rows || [];
            const todayStr = new Date().toISOString().split("T")[0];
            const currentActiveSeasons = activeSeasons.filter((s) => {
                if (!s.endDate) return true;
                const endStr = s.endDate.split("T")[0];
                return endStr >= todayStr;
            });

            if (currentActiveSeasons.length > 0) {
                await Promise.all(
                    currentActiveSeasons.map((season) =>
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
