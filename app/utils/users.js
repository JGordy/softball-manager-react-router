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
