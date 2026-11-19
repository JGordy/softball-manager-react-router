import { useMemo } from "react";
import { Avatar } from "@mantine/core";
import { getUserPhotoUrl } from "@/utils/avatars";

/**
 * Reusable User Avatar component backed by Appwrite `avatars.getPhoto()`.
 * Falls back to Mantine `<Avatar>` initials if no photo URL is resolved.
 *
 * @param {Object} props
 * @param {Object} props.user - The user object from Appwrite account.get()
 * @param {number} [props.size=40] - Size of the avatar in pixels
 * @param {string} [props.className] - Optional CSS class
 */
export default function UserAvatar({ user, size = 40, className = "" }) {
    const userId = user?.$id;
    const userName = user?.name;
    const userEmail = user?.email;
    const displayName = userName || userEmail || "User";

    const avatarUrl = useMemo(() => {
        const name = userName || userEmail || (!userId ? "User" : undefined);

        return getUserPhotoUrl({
            userId,
            name,
            size,
        });
    }, [userId, userName, userEmail, size]);

    return (
        <Avatar
            src={avatarUrl}
            name={displayName}
            alt={userName || "User Avatar"}
            size={size}
            radius="100%"
            color="lime"
            className={className}
        />
    );
}
