/**
 * Push Notification Actions
 * Server-side actions for sending push notifications via Appwrite Messaging
 */

import { ID, MessagingProviderType } from "node-appwrite";

import {
    createAdminClient,
    createSessionClient,
} from "@/utils/appwrite/server.js";

import {
    NOTIFICATION_TYPES,
    formatNotificationPayload,
    validateUserId,
    validateNotificationPayload,
    buildTeamTopic,
} from "@/utils/notifications.js";

/**
 * Get a push target for the current user by targetId
 * @param {Request} request - The incoming request (for session)
 * @param {string} targetId - The push target ID to look up
 * @returns {Promise<Object|null>} The push target object if found and owned by user, else null
 */
export async function getPushTarget({ request, targetId }) {
    if (!targetId) {
        throw new Error("Target ID is required");
    }

    // Get current user
    const { account } = await createSessionClient(request);
    const user = await account.get();

    // Use admin client to fetch the target
    const { users } = createAdminClient();

    // Try to fetch the target for this user
    try {
        const target = await users.getTarget({
            userId: user.$id,
            targetId: targetId,
        });

        // Verify ownership
        if (target && target.userId === user.$id) {
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
 * @param {Request} request - The incoming request (for session)
 * @returns {Promise<Array>} Array of push targets
 */
export async function listPushTargets({ request }) {
    // Get current user
    const { account } = await createSessionClient(request);
    const user = await account.get();

    // Use admin client to fetch the targets
    const { users } = createAdminClient();

    try {
        const result = await users.listTargets({
            userId: user.$id,
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
 * @param {Request} request - The incoming request (for session)
 * @param {string} fcmToken - The FCM token from the browser
 * @param {string} providerId - The FCM provider ID
 * @returns {Promise<Object>} The created or existing push target
 */
export async function createPushTarget({ request, fcmToken, providerId }) {
    if (!fcmToken) {
        throw new Error("FCM token is required");
    }
    if (!providerId) {
        throw new Error("Provider ID is required");
    }

    // First, get the current user's ID from the session
    const { account } = await createSessionClient(request);
    const user = await account.get();

    // Use admin client to create the push target via Users service
    const { users } = createAdminClient();

    // Check if a target with this FCM token already exists
    try {
        const existingTargets = await users.listTargets({
            userId: user.$id,
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
    const target = await users.createTarget({
        userId: user.$id,
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
 * @param {Request} request - The incoming request (for session)
 * @param {string} targetId - The push target ID to delete
 * @returns {Promise<Object>} Success result
 */
export async function deletePushTarget({ request, targetId }) {
    if (!targetId) {
        throw new Error("Target ID is required");
    }

    // First, get the current user's ID from the session
    const { account } = await createSessionClient(request);
    const user = await account.get();

    // Use admin client to delete the push target via Users service
    const { users } = createAdminClient();

    await users.deleteTarget({
        userId: user.$id,
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

    // Resolve absolute URL if origin is provided
    let finalUrl = url;
    if (origin && url.startsWith("/")) {
        try {
            finalUrl = new URL(url, origin).href;
        } catch (e) {
            console.error("Error resolving absolute URL:", e);
        }
    }

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
        const message = await messaging.createPush({
            messageId: ID.unique(),
            title,
            body,
            users: userIds,
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
 * @param {Object} [options.data] - Additional data
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendTeamNotification({
    teamId,
    title,
    body,
    type = NOTIFICATION_TYPES.TEAM_ANNOUNCEMENT,
    url,
    data = {},
}) {
    if (!teamId) {
        throw new Error("Team ID is required");
    }

    const topic = buildTeamTopic(teamId);
    const defaultUrl = url || `/team/${teamId}`;

    const payload = formatNotificationPayload({
        title,
        body,
        type,
        url: defaultUrl,
        data: {
            ...data,
            teamId,
        },
    });

    validateNotificationPayload(payload);

    try {
        const { messaging } = createAdminClient();

        // Create and send a push notification to a topic
        const message = await messaging.createPush({
            messageId: ID.unique(),
            title,
            body,
            topics: [topic],
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
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendGameReminder({
    gameId,
    teamId,
    userIds,
    gameName,
    gameTime,
    location,
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
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendLineupFinalizedNotification({
    gameId,
    teamId,
    userIds,
    gameName,
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
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendAttendanceRequest({
    gameId,
    teamId,
    userIds,
    gameName,
    gameDate,
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
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendGameFinalNotification({
    gameId,
    teamId,
    userIds,
    opponent,
    score,
}) {
    if (!gameId) {
        throw new Error("Game ID is required");
    }

    return sendPushNotification({
        userIds,
        title: "🏁 Game Final",
        body: `The game against ${opponent} just went final. We ${score}`,
        type: NOTIFICATION_TYPES.GAME_FINAL,
        url: `/events/${gameId}/scoring#boxscore`,
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
 * @returns {Promise<Object>} Result of the notification send operation
 */
export async function sendAwardVoteNotification({
    gameId,
    teamId,
    userIds,
    opponent,
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
        data: {
            gameId,
            teamId,
            opponent,
        },
    });
}
