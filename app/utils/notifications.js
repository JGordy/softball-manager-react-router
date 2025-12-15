/**
 * Push Notification Utilities
 * Shared constants and helper functions for the push notification system
 */

// Notification types for consistent categorization
export const NOTIFICATION_TYPES = {
    GAME_REMINDER: "game_reminder",
    LINEUP_FINALIZED: "lineup_finalized",
    TEAM_ANNOUNCEMENT: "team_announcement",
    ATTENDANCE_REQUEST: "attendance_request",
    INVITATION: "invitation",
};

// Notification topics for broadcast messaging
export const NOTIFICATION_TOPICS = {
    ALL_USERS: "all_users",
    TEAM_PREFIX: "team_", // Append team ID: team_abc123
    SEASON_PREFIX: "season_", // Append season ID: season_xyz789
};

/**
 * Build a topic name for a specific team
 * @param {string} teamId - The team ID
 * @returns {string} The topic name
 */
export function buildTeamTopic(teamId) {
    if (!teamId) {
        throw new Error("Team ID is required to build team topic");
    }
    return `${NOTIFICATION_TOPICS.TEAM_PREFIX}${teamId}`;
}

/**
 * Build a topic name for a specific season
 * @param {string} seasonId - The season ID
 * @returns {string} The topic name
 */
export function buildSeasonTopic(seasonId) {
    if (!seasonId) {
        throw new Error("Season ID is required to build season topic");
    }
    return `${NOTIFICATION_TOPICS.SEASON_PREFIX}${seasonId}`;
}

/**
 * Format a notification payload for push delivery
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} [options.type] - Notification type from NOTIFICATION_TYPES
 * @param {string} [options.icon] - URL to notification icon
 * @param {string} [options.badge] - URL to notification badge
 * @param {string} [options.url] - Deep link URL to open when notification is clicked
 * @param {Object} [options.data] - Additional data to include in the notification
 * @returns {Object} Formatted notification payload
 */
export function formatNotificationPayload({
    title,
    body,
    type = NOTIFICATION_TYPES.TEAM_ANNOUNCEMENT,
    icon = "/android-chrome-192x192.png",
    badge = "/favicon-32x32.png",
    url = "/",
    data = {},
}) {
    if (!title) {
        throw new Error("Notification title is required");
    }
    if (!body) {
        throw new Error("Notification body is required");
    }

    return {
        title,
        body,
        icon,
        badge,
        data: {
            type,
            url,
            timestamp: new Date().toISOString(),
            ...data,
        },
    };
}

/**
 * Check if the browser supports push notifications
 * @returns {boolean} Whether push notifications are supported
 */
export function isPushSupported() {
    if (typeof window === "undefined") {
        return false;
    }

    return (
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

/**
 * Get the current notification permission status
 * @returns {string|null} The permission status ('granted', 'denied', 'default') or null if not supported
 */
export function getNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
    }
    return Notification.permission;
}

/**
 * Check if notifications are currently enabled
 * @returns {boolean} Whether notifications are enabled (permission granted)
 */
export function areNotificationsEnabled() {
    return getNotificationPermission() === "granted";
}

/**
 * Check if notification permission was denied
 * @returns {boolean} Whether notifications were denied
 */
export function areNotificationsDenied() {
    return getNotificationPermission() === "denied";
}

/**
 * Validate that a user ID is provided for targeting
 * @param {string} userId - The user ID to validate
 * @throws {Error} If user ID is not provided
 */
export function validateUserId(userId) {
    if (!userId || typeof userId !== "string") {
        throw new Error("Valid user ID is required");
    }
}

/**
 * Validate notification payload before sending
 * @param {Object} payload - The notification payload to validate
 * @throws {Error} If payload is invalid
 */
export function validateNotificationPayload(payload) {
    if (!payload || typeof payload !== "object") {
        throw new Error("Notification payload must be an object");
    }
    if (!payload.title || typeof payload.title !== "string") {
        throw new Error("Notification title is required and must be a string");
    }
    if (!payload.body || typeof payload.body !== "string") {
        throw new Error("Notification body is required and must be a string");
    }
}
