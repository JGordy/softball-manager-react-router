import {
    REQUIRED_PROFILE_FIELDS,
    getIncompleteProfileFields,
    isUserProfileComplete,
} from "../users";

describe("Users Utils", () => {
    describe("getIncompleteProfileFields", () => {
        it("should return all required fields if user object is empty", () => {
            const user = {};
            const incomplete = getIncompleteProfileFields(user);
            expect(incomplete).toHaveLength(
                Object.keys(REQUIRED_PROFILE_FIELDS).length,
            );
            expect(incomplete).toContain("email");
            expect(incomplete).toContain("phoneNumber");
            expect(incomplete).toContain("gender");
            expect(incomplete).toContain("bats");
            expect(incomplete).toContain("throws");
            expect(incomplete).toContain("preferredPositions");
        });

        it("should return empty array if user has all required fields", () => {
            const user = {
                email: "test@example.com",
                phoneNumber: "123-456-7890",
                gender: "Female",
                bats: "R",
                throws: "R",
                preferredPositions: ["1B"],
            };
            const incomplete = getIncompleteProfileFields(user);
            expect(incomplete).toHaveLength(0);
        });

        it("should return fields that are null or undefined", () => {
            const user = {
                email: "test@example.com",
                phoneNumber: null,
                gender: undefined,
                bats: "R",
                throws: "R",
                preferredPositions: ["1B"],
            };
            const incomplete = getIncompleteProfileFields(user);
            expect(incomplete).toContain("phoneNumber");
            expect(incomplete).toContain("gender");
            expect(incomplete).not.toContain("email");
        });

        it("should return array fields that are empty", () => {
            const user = {
                email: "test@example.com",
                phoneNumber: "123-456-7890",
                gender: "Female",
                bats: "R",
                throws: "R",
                preferredPositions: [],
            };
            const incomplete = getIncompleteProfileFields(user);
            expect(incomplete).toContain("preferredPositions");
        });

        it("should return empty array if user is null or undefined", () => {
            // Based on implementation: if (!user) return [];
            expect(getIncompleteProfileFields(null)).toEqual([]);
            expect(getIncompleteProfileFields(undefined)).toEqual([]);
        });
    });

    describe("isUserProfileComplete", () => {
        it("should return true if all fields are present", () => {
            const user = {
                email: "test@example.com",
                phoneNumber: "123-456-7890",
                gender: "Female",
                bats: "R",
                throws: "R",
                preferredPositions: ["1B"],
            };
            expect(isUserProfileComplete(user)).toBe(true);
        });

        it("should return false if any field is missing", () => {
            const user = {
                email: "test@example.com",
                // phoneNumber missing
                gender: "Female",
                bats: "R",
                throws: "R",
                preferredPositions: ["1B"],
            };
            expect(isUserProfileComplete(user)).toBe(false);
        });
    });
});
