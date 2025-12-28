import { useMemo } from "react";
import { appwriteConfig } from "@/utils/appwrite/config";

/**
 * Reusable User Avatar component with Appwrite Initials fallback.
 *
 * @param {Object} props
 * @param {Object} props.user - The user object from Appwrite account.get()
 * @param {number} [props.size=40] - Size of the avatar in pixels
 * @param {string} [props.className] - Optional CSS class
 */
export default function UserAvatar({ user, size = 40, className = "" }) {
    const avatarUrl = useMemo(() => {
        // 1. Check if user has a provider-supplied avatar in preferences
        if (user?.prefs?.avatar) {
            return user.prefs.avatar;
        }

        // 2. Fallback: Use Appwrite Avatars API to generate initials
        // We use the account's name or a fallback
        const name = user?.name || user?.email || "User";
        const baseUrl = `${appwriteConfig.endpoint}/avatars/initials`;
        return `${baseUrl}?name=${encodeURIComponent(name)}&width=${size}&height=${size}&project=${appwriteConfig.projectId}`;
    }, [user, size]);

    return (
        <img
            src={avatarUrl}
            alt={user?.name || "User Avatar"}
            className={className}
            style={{
                borderRadius: "50%",
                width: size,
                height: size,
                objectFit: "cover",
                display: "block",
            }}
        />
    );
}
