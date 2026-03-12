export const REQUIRED_PROFILE_FIELDS = {
    email: { label: "email" },
    phoneNumber: { label: "phone number" },
    gender: { label: "gender" },
    bats: { label: "bats" },
    throws: { label: "throws" },
    preferredPositions: { label: "preferred positions" },
};

export const getIncompleteProfileFields = (user) => {
    if (!user) return [];
    return Object.keys(REQUIRED_PROFILE_FIELDS).filter((key) => {
        const value = user[key];
        return (
            value === null ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0)
        );
    });
};

export const isUserProfileComplete = (user) => {
    return getIncompleteProfileFields(user).length === 0;
};

/**
 * Checks if a user has permission to view another player's stats.
 * @param {Object} player - The player whose stats are being viewed.
 * @param {Object} currentUser - The logged-in user viewing the stats.
 * @param {boolean} [isManager] - Whether the currentUser is a coach/manager in the current context.
 * @returns {boolean}
 */
export const canViewStats = (player, currentUser, isManager = false) => {
    if (!player || !currentUser) return false;

    // 1. Owner can always see their own stats
    if (player.$id === currentUser.$id) return true;

    // 2. If privacy is public, everyone can see
    const statsPrivacy = player.prefs?.statsPrivacy || "public";
    if (statsPrivacy === "public") return true;

    // 3. If private, only me/coaches
    // isManager is passed from team-specific context if available
    if (isManager) return true;

    return false;
};
