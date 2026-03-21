/**
 * Push Notification Actions
 * Server-side actions for sending push notifications via Appwrite Messaging
 */

import { ID, MessagingProviderType, Query } from "node-appwrite";

import { createAdminClient } from "@/utils/appwrite/server.js";

import { getAppwriteTeam } from "@/utils/teams.js";

import {
    NOTIFICATION_TYPES,
    formatNotificationPayload,
    validateUserId,
    validateNotificationPayload,
    buildTeamTopic,
} from "@/utils/notifications.js";

/**
 * Helper to get authenticated user and admin users client
 * @param {Object} client - The incoming client
 * @returns {Promise<{accountUser: Object, adminUsersClient: Object}>} The user object and admin users client
 */
export async function getAuthUserAndAdminUsers(client) {
    const { account } = client;
    const accountUser = await account.get();
    const { users: adminUsersClient } = createAdminClient();
    return { accountUser, adminUsersClient };
}

/**
 * Helper to resolve an absolute URL using the provided origin or environment defaults
 * @param {string} url - The relative or absolute URL to resolve
 * @param {string} [origin] - Optional base origin
 * @returns {string|undefined} The resolved absolute URL or the original input
 */
export function resolveAbsoluteUrl(url, origin) {
    const baseOrigin =
        origin || process.env.VITE_APP_URL || "http://localhost:5173";

    if (url && url.startsWith("/")) {
        try {
            return new URL(url, baseOrigin).href;
        } catch (e) {
            console.error("Error resolving absolute URL:", e);
        }
    }

    return url;
}

/**
 * Helper to find a specific subscriber in a topic with pagination
 * @param {Object} messaging - Appwrite Messaging client
 * @param {string} topic - Topic ID
 * @param {string} targetId - Target ID to look for
 * @returns {Promise<Object|null>} The subscriber object if found, else null
 */
async function findSubscriber(messaging, topic, targetId) {
    let cursor = null;
    let foundSubscriber = null;

    do {
        const queries = [Query.limit(100)];
        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await messaging.listSubscribers(topic, queries);
        foundSubscriber = response.subscribers.find(
            (s) => s.targetId === targetId,
        );

        if (foundSubscriber) {
            return foundSubscriber;
        }

        if (response.subscribers.length < 100) {
            break;
        }

        cursor = response.subscribers[response.subscribers.length - 1].$id;
    } while (true);

    return null;
}

/**
 * Get a push target for the current user by targetId
 * @param {Object} client - The incoming client (for session)
 * @param {string} targetId - The push target ID to look up
 * @returns {Promise<Object|null>} The push target object if found and owned by user, else null
 */
export async function getPushTarget({ client, targetId }) {
    if (!targetId) {
        throw new Error("Target ID is required");
    }

    const { accountUser, adminUsersClient } =
        await getAuthUserAndAdminUsers(client);

    // Try to fetch the target for this user
    try {
        const target = await adminUsersClient.getTarget({
            userId: accountUser.$id,
            targetId: targetId,
        });

        // Verify ownership
        if (target && target.userId === accountUser.$id) {
            return target;
        }
        return null;
    } catch (err) {
        // Not found or not owned by user
        console.error("[getPushTarget] Error fetching push target:", err);
        return null;
    }
}

/**
 * List all push targets for the current user
 * @param {Request} client - The incoming client (for session)
 * @returns {Promise<Array>} Array of push targets
 */
export async function listPushTargets({ client }) {
    const { accountUser, adminUsersClient } =
        await getAuthUserAndAdminUsers(client);

    try {
        const result = await adminUsersClient.listTargets({
            userId: accountUser.$id,
        });

        // Filter to only push targets
        const pushTargets = result.targets.filter(
            (target) => target.providerType === MessagingProviderType.Push,
        );

        return pushTargets;
    } catch (err) {
        console.error("[listPushTargets] Error:", err);
        return [];
    }
}

/**
 * Create a push target for the current user (server-side)
 * This registers the user's device for push notifications
 * If a target with the same FCM token already exists, returns that instead
 * @param {Request} client - The incoming client (for session)
 * @param {string} fcmToken - The FCM token from the browser
 * @param {string} providerId - The FCM provider ID
 * @returns {Promise<Object>} The created or existing push target
 */
export async function createPushTarget({ client, fcmToken, providerId }) {
    if (!fcmToken) {
        throw new Error("FCM token is required");
    }
    if (!providerId) {
        throw new Error("Provider ID is required");
    }

    const { accountUser, adminUsersClient } =
        await getAuthUserAndAdminUsers(client);

    // Check if a target with this FCM token already exists
    try {
        const existingTargets = await adminUsersClient.listTargets({
            userId: accountUser.$id,
        });

        const existingPushTarget = existingTargets.targets.find(
            (target) =>
                target.providerType === MessagingProviderType.Push &&
                target.identifier === fcmToken,
        );

        if (existingPushTarget) {
            return existingPushTarget;
        }
    } catch (err) {
        console.log(
            "[createPushTarget] Could not check for existing targets:",
            err,
        );
        // Continue to create new target
    }

    const targetId = ID.unique();
    const target = await adminUsersClient.createTarget({
        userId: accountUser.$id,
        targetId,
        providerType: MessagingProviderType.Push,
        identifier: fcmToken,
        providerId,
    });

    return target;
}

/**
 * Delete a push target for the current user (server-side)
 * This unregisters the user's device from push notifications
 * @param {Request} client - The incoming client (for session)
 * @param {string} targetId - The push target ID to delete
 * @returns {Promise<Object>} Success result
 */
export async function deletePushTarget({ client, targetId }) {
    if (!targetId) {
        throw new Error("Target ID is required");
    }

    const { accountUser, adminUsersClient } =
        await getAuthUserAndAdminUsers(client);

    await adminUsersClient.deleteTarget({
        userId: accountUser.$id,
        targetId,
    });

    return { success: true };
}

/**
 * Send a push notification to specific users
 * @param {Object} options - Notification options
 * @param {string[]} options.userIds - Array of user IDs to send to
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} [options.type] - Notification type from NOTIFICATION_TYPES
 * @param {string} [options.url] - Deep link URL
 * @param {string} [options.origin] - Origin to use for absolute URLs
 * @param {Object} [options.data] - Additional data
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendPushNotification({
    userIds,
    title,
    body,
    type = NOTIFICATION_TYPES.TEAM_ANNOUNCEMENT,
    url = "/",
    origin,
    data = {},
}) {
    // Validate inputs
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("At least one user ID is required");
    }

    userIds.forEach(validateUserId);

    // Resolve absolute URLs
    const finalUrl = resolveAbsoluteUrl(url, origin);
    const iconUrl = resolveAbsoluteUrl("/android-chrome-192x192.png", origin);

    const payload = formatNotificationPayload({
        title,
        body,
        type,
        url: finalUrl,
        data,
    });

    validateNotificationPayload(payload);

    try {
        const { messaging } = createAdminClient();

        // Create and send a push notification message
        // Omit top-level title/body to ensure a data-only silent push
        // that our unified service-worker.js can handle deterministically
        const message = await messaging.createPush({
            messageId: ID.unique(),
            users: userIds,
            action: finalUrl,
            icon: iconUrl,
            color: "#facc15",
            tag: type,
            data: payload.data,
        });

        return {
            success: true,
            messageId: message.$id,
            recipientCount: userIds.length,
        };
    } catch (error) {
        console.error("Error sending push notification:", error);
        return {
            success: false,
            error: error.message || "Failed to send push notification",
        };
    }
}

/**
 * Send a push notification to all members of a team
 * @param {Object} options - Notification options
 * @param {string} options.teamId - Team ID to send to
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} [options.type] - Notification type
 * @param {string} [options.url] - Deep link URL
 * @param {string} [options.origin] - Origin to use for absolute URLs
 * @param {Object} [options.data] - Additional data
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendTeamNotification({
    teamId,
    title,
    body,
    type = NOTIFICATION_TYPES.TEAM_ANNOUNCEMENT,
    url,
    origin,
    data = {},
}) {
    if (!teamId) {
        throw new Error("Team ID is required");
    }

    const topic = buildTeamTopic(teamId);
    const defaultUrl = url || `/team/${teamId}`;

    const finalUrl = resolveAbsoluteUrl(defaultUrl, origin);

    const payload = formatNotificationPayload({
        title,
        body,
        type,
        url: finalUrl,
        data: {
            ...data,
            teamId,
        },
    });

    validateNotificationPayload(payload);

    try {
        const { messaging } = createAdminClient();

        // Create and send a push notification to a topic
        // Omit top-level title/body to ensure a data-only silent push
        // that our unified service-worker.js can handle deterministically
        const message = await messaging.createPush({
            messageId: ID.unique(),
            topics: [topic],
            action: finalUrl,
            icon: resolveAbsoluteUrl("/android-chrome-192x192.png", origin),
            color: "#facc15",
            tag: type,
            data: payload.data,
        });

        return {
            success: true,
            messageId: message.$id,
            topic,
        };
    } catch (error) {
        console.error("Error sending team notification:", error);
        return {
            success: false,
            error: error.message || "Failed to send team notification",
        };
    }
}

/**
 * Send a game reminder notification
 * @param {Object} options - Reminder options
 * @param {string} options.gameId - Game ID
 * @param {string} options.teamId - Team ID
 * @param {string[]} options.userIds - User IDs to notify
 * @param {string} options.gameName - Name/description of the game
 * @param {string} options.gameTime - Formatted game time string
 * @param {string} options.location - Game location
 * @param {string} [options.origin] - Origin to use for absolute URLs
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendGameReminder({
    gameId,
    teamId,
    userIds,
    gameName,
    gameTime,
    location,
    origin,
}) {
    if (!gameId) {
        throw new Error("Game ID is required");
    }

    return sendPushNotification({
        userIds,
        title: "⚾ Game Reminder",
        body: `${gameName} at ${gameTime}${location ? ` - ${location}` : ""}`,
        type: NOTIFICATION_TYPES.GAME_REMINDER,
        url: `/events/${gameId}`,
        origin,
        data: {
            gameId,
            teamId,
            gameName,
            gameTime,
            location,
        },
    });
}

/**
 * Send a notification when lineup is finalized
 * @param {Object} options - Lineup options
 * @param {string} options.gameId - Game ID
 * @param {string} options.teamId - Team ID
 * @param {string[]} options.userIds - User IDs to notify
 * @param {string} options.gameName - Name/description of the game
 * @param {string} [options.origin] - Origin to use for absolute URLs
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendLineupFinalizedNotification({
    gameId,
    teamId,
    userIds,
    gameName,
    origin,
}) {
    if (!gameId) {
        throw new Error("Game ID is required");
    }

    return sendPushNotification({
        userIds,
        title: "📋 Lineup Posted",
        body: `The lineup for ${gameName} has been finalized. Check your position!`,
        type: NOTIFICATION_TYPES.LINEUP_FINALIZED,
        url: `/events/${gameId}#lineup`,
        origin,
        data: {
            gameId,
            teamId,
            gameName,
        },
    });
}

/**
 * Send an attendance request notification
 * @param {Object} options - Attendance options
 * @param {string} options.gameId - Game ID
 * @param {string} options.teamId - Team ID
 * @param {string[]} options.userIds - User IDs to notify
 * @param {string} options.gameName - Name/description of the game
 * @param {string} options.gameDate - Formatted game date
 * @param {string} [options.origin] - Origin to use for absolute URLs
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendAttendanceRequest({
    gameId,
    teamId,
    userIds,
    gameName,
    gameDate,
    origin,
}) {
    if (!gameId) {
        throw new Error("Game ID is required");
    }

    return sendPushNotification({
        userIds,
        title: "📝 RSVP Requested",
        body: `Please confirm your attendance for ${gameName} on ${gameDate}`,
        type: NOTIFICATION_TYPES.ATTENDANCE_REQUEST,
        url: `/events/${gameId}#attendance`,
        origin,
        data: {
            gameId,
            teamId,
            gameName,
            gameDate,
        },
    });
}

/**
 * Send a notification when a game is final
 * @param {Object} options - Notification options
 * @param {string} options.gameId - Game ID
 * @param {string} options.teamId - Team ID
 * @param {string[]} options.userIds - User IDs to notify
 * @param {string} options.opponent - Opponent name
 * @param {string} options.score - Game final score (e.g. "12 - 4")
 * @param {string} [options.origin] - Origin to use for absolute URLs
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendGameFinalNotification({
    gameId,
    teamId,
    userIds,
    opponent,
    score,
    origin,
}) {
    if (!gameId) {
        throw new Error("Game ID is required");
    }

    return sendPushNotification({
        userIds,
        title: "🏁 Game Final",
        body: `The game against ${opponent} just went final. We ${score}`,
        type: NOTIFICATION_TYPES.GAME_FINAL,
        url: `/events/${gameId}/gameday#boxscore`,
        origin,
        data: {
            gameId,
            teamId,
            opponent,
            score,
        },
    });
}

/**
 * Send a notification to remind players to vote for game awards
 * @param {Object} options - Notification options
 * @param {string} options.gameId - Game ID
 * @param {string} options.teamId - Team ID
 * @param {string[]} options.userIds - User IDs to notify
 * @param {string} options.opponent - Opponent name
 * @param {string} [options.origin] - Origin to use for absolute URLs
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendAwardVoteNotification({
    gameId,
    teamId,
    userIds,
    opponent,
    origin,
}) {
    if (!gameId) {
        throw new Error("Game ID is required");
    }

    return sendPushNotification({
        userIds,
        title: "🏆 Time to Vote!",
        body: `The game against ${opponent} is over. Head over to the awards tab and vote for today's top performers!`,
        type: NOTIFICATION_TYPES.VOTE_REMINDER,
        url: `/events/${gameId}#awards`,
        origin,
        data: {
            gameId,
            teamId,
            opponent,
        },
    });
}

/**
 * Subscribe a target to a team's notification topic
 * @param {Object} options
 * @param {string} options.teamId - Team ID
 * @param {string} options.targetId - The push target ID
 * @returns {Promise<Object>} Success status
 */
export async function subscribeToTeam({ teamId, targetId }) {
    if (!teamId || !targetId) {
        throw new Error("Team ID and Target ID are required");
    }

    const topic = buildTeamTopic(teamId);
    const { messaging } = createAdminClient();

    try {
        // Appwrite Messaging: Create a subscriber
        // Correct Signature: createSubscriber(topicId, subscriberId, targetId)
        await messaging.createSubscriber(topic, ID.unique(), targetId);

        return { success: true };
    } catch (error) {
        // If error is "subscriber already exists" (code 409), that's fine
        if (error.code === 409) {
            return { success: true, alreadySubscribed: true };
        }

        // If error is "topic not found" (code 404), create it and retry
        if (error.code === 404) {
            try {
                // Fetch team details to get the name for the topic
                const team = await getAppwriteTeam({ teamId });

                // Try to create the topic, but ignore if it already exists (409)
                try {
                    await messaging.createTopic(
                        topic,
                        team.name || `Team ${teamId}`,
                    );
                } catch (topicError) {
                    if (topicError.code !== 409) {
                        throw topicError;
                    }
                }

                // Retry subscription
                await messaging.createSubscriber(topic, ID.unique(), targetId);
                return { success: true, createdTopic: true };
            } catch (createError) {
                console.error(
                    `[subscribeToTeam] Error creating topic/subscribing ${topic}:`,
                    createError,
                );
                throw createError;
            }
        }

        console.error(
            `[subscribeToTeam] Error subscribing to topic ${topic}:`,
            error,
        );
        throw error;
    }
}

/**
 * Unsubscribe a target from a team's notification topic
 * @param {Object} options
 * @param {string} options.teamId - Team ID
 * @param {string} options.targetId - The push target ID
 * @returns {Promise<Object>} Success status
 */
export async function unsubscribeFromTeam({ teamId, targetId }) {
    if (!teamId || !targetId) {
        throw new Error("Team ID and Target ID are required");
    }

    const topic = buildTeamTopic(teamId);
    const { messaging } = createAdminClient();

    try {
        // To delete, we need the subscriber ID, not just the target ID.
        // So we must list subscribers for this topic and find the one with our targetId.
        const subscriber = await findSubscriber(messaging, topic, targetId);

        if (subscriber) {
            await messaging.deleteSubscriber(topic, subscriber.$id);
        }

        return { success: true };
    } catch (error) {
        // If topic or subscriber doesn't exist, consider it "unsubscribed"
        if (error.code === 404) {
            return { success: true };
        }

        console.error(
            `[unsubscribeFromTeam] Error unsubscribing from topic ${topic}:`,
            error,
        );
        throw error;
    }
}

/**
 * Subscribe a target to all teams the user is a member of
 * Used when a user globally enables notifications
 * @param {Object} options
 * @param {client} options.client - Client object
 * @param {string} options.targetId - Push Target ID
 * @returns {Promise<Object>} Success status and count
 */
export async function subscribeToAllTeams({ client, targetId }) {
    if (!client || !targetId) {
        return { success: false, error: "Client and Target ID are required" };
    }

    try {
        // Use session client to get the user's teams
        const { teams } = client;

        let subscribedCount = 0;
        const errors = [];
        const allTeams = [];
        let cursor = null;
        let hasMore = true;
        const pageSize = 100;

        // Fetch all teams using pagination
        while (hasMore) {
            const queries = [Query.limit(pageSize)];
            if (cursor) {
                queries.push(Query.cursorAfter(cursor));
            }

            const page = await teams.list(queries);
            const pageTeams = page?.teams || [];

            if (pageTeams.length > 0) {
                allTeams.push(...pageTeams);
                cursor = pageTeams[pageTeams.length - 1].$id;
            } else {
                hasMore = false;
            }

            if (pageTeams.length < pageSize) {
                hasMore = false;
            }
        }

        console.log(
            `[subscribeToAllTeams] Found ${allTeams.length} teams for user. Subscribing...`,
        );

        // Subscribe to each team
        await Promise.all(
            allTeams.map(async (team) => {
                try {
                    await subscribeToTeam({
                        teamId: team.$id,
                        targetId,
                    });
                    subscribedCount++;
                } catch (err) {
                    console.error(
                        `[subscribeToAllTeams] Failed to subscribe to team ${team.$id}:`,
                        err,
                    );
                    errors.push({ teamId: team.$id, error: err.message });
                }
            }),
        );

        console.log(
            `[subscribeToAllTeams] Successfully subscribed to ${subscribedCount} teams.`,
        );

        return {
            success: true,
            subscribedCount,
            totalTeams: allTeams.length,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error) {
        console.error("[subscribeToAllTeams] Error:", error);
        // Don't throw, just return failure, so we don't block the main flow
        return { success: false, error: error.message };
    }
}

/**
 * Check if a target is subscribed to a team's notification topic
 * @param {Object} options
 * @param {string} options.teamId - Team ID
 * @param {string} options.targetId - The push target ID
 * @returns {Promise<boolean>} params
 */
export async function getTeamSubscriptionStatus({ teamId, targetId }) {
    if (!teamId || !targetId) {
        return false;
    }

    const topic = buildTeamTopic(teamId);
    const { messaging } = createAdminClient();

    try {
        const subscriber = await findSubscriber(messaging, topic, targetId);
        return !!subscriber;
    } catch (error) {
        // If topic doesn't exist, no one is subscribed
        if (error.code === 404) {
            return false;
        }
        console.error(
            `[getTeamSubscriptionStatus] Error checking status for ${topic}:`,
            error,
        );
        return false;
    }
}
