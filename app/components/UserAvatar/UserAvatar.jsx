import { useMemo } from "react";
import { getUserPhotoUrl } from "@/utils/avatars";

/**
 * Reusable User Avatar component backed by Appwrite `avatars.getPhoto()`.
 *
 * @param {Object} props
 * @param {Object} props.user - The user object from Appwrite account.get()
 * @param {number} [props.size=40] - Size of the avatar in pixels
 * @param {string} [props.className] - Optional CSS class
 */
export default function UserAvatar({ user, size = 40, className = "" }) {
    const avatarUrl = useMemo(() => {
        const userId = user?.$id;
        const name =
            user?.name || user?.email || (!userId ? "User" : undefined);

        return getUserPhotoUrl({
            userId,
            name,
            size,
        });
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
