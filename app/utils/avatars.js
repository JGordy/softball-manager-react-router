import { avatars, client } from "@/utils/appwrite/client";

const MAX_AVATAR_DIMENSION = 2000;
const MAX_NAME_LENGTH = 128;

/**
 * Builds an Appwrite `avatars.getPhoto()` URL for a user or guest player.
 *
 * Always pass an explicit `userId` (rather than `"current()"`) because sessions
 * are managed via an HttpOnly `appwrite-session` cookie on the app domain.
 *
 * @param {Object} [options]
 * @param {string} [options.userId] - Appwrite Auth user ID.
 * @param {string} [options.emailHash] - Precomputed SHA-256 hash of a trimmed, lowercase email.
 * @param {string} [options.name] - Display name used for initials fallback (truncated to 128 chars).
 * @param {number} [options.size=40] - Desired CSS pixel size (scaled 2x for retina displays).
 * @param {number} [options.quality] - Optional output image quality (0–100).
 * @returns {string|undefined} The resolved photo URL, or `undefined` when inputs or client config are missing.
 */
export function getUserPhotoUrl({
    userId,
    emailHash,
    name,
    size = 40,
    quality,
} = {}) {
    if (!userId && !emailHash && !name) {
        return undefined;
    }

    if (!client?.config?.endpoint || !client?.config?.project) {
        return undefined;
    }

    const numericSize = Number.isFinite(size) && size > 0 ? size : 40;
    const dimension = Math.min(
        Math.round(numericSize * 2),
        MAX_AVATAR_DIMENSION,
    );

    const params = {
        width: dimension,
        height: dimension,
    };

    if (userId) {
        params.userId = userId;
    }

    if (emailHash) {
        params.emailHash = emailHash;
    }

    if (name) {
        params.name = String(name).trim().slice(0, MAX_NAME_LENGTH);
    }

    if (typeof quality === "number") {
        params.quality = quality;
    }

    try {
        return avatars.getPhoto(params);
    } catch {
        return undefined;
    }
}
