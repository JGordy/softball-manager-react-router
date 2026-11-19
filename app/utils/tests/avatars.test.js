import { avatars, client } from "@/utils/appwrite/client";
import {
    getPlayerDisplayName,
    getPlayerPhotoUrl,
    getUserPhotoUrl,
} from "../avatars";

jest.mock("@/utils/appwrite/client", () => ({
    client: {
        config: {
            endpoint: "https://mock-appwrite.io/v1",
            project: "mock-project-id",
        },
    },
    avatars: {
        getPhoto: jest.fn(
            (params) =>
                `https://mock-appwrite.io/v1/avatars/photo?${new URLSearchParams(
                    Object.entries(params).map(([k, v]) => [k, String(v)]),
                ).toString()}`,
        ),
    },
}));

describe("getPlayerDisplayName", () => {
    it("returns empty string for null/undefined", () => {
        expect(getPlayerDisplayName(null)).toBe("");
        expect(getPlayerDisplayName(undefined)).toBe("");
    });

    it("prefers player.name when present", () => {
        expect(getPlayerDisplayName({ name: "  Jane Doe  " })).toBe("Jane Doe");
    });

    it("safely concatenates firstName and lastName without undefined", () => {
        expect(getPlayerDisplayName({ firstName: "Jane" })).toBe("Jane");
        expect(getPlayerDisplayName({ lastName: "Doe" })).toBe("Doe");
        expect(
            getPlayerDisplayName({ firstName: "Jane", lastName: "Doe" }),
        ).toBe("Jane Doe");
    });
});

describe("getUserPhotoUrl", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        client.config.endpoint = "https://mock-appwrite.io/v1";
        client.config.project = "mock-project-id";
    });

    it("returns undefined when no userId, emailHash, or name is provided", () => {
        expect(getUserPhotoUrl()).toBeUndefined();
        expect(getUserPhotoUrl({})).toBeUndefined();
        expect(avatars.getPhoto).not.toHaveBeenCalled();
    });

    it("returns undefined when Appwrite client config is incomplete", () => {
        client.config.endpoint = "";
        expect(getUserPhotoUrl({ userId: "user-123" })).toBeUndefined();

        client.config.endpoint = "https://mock-appwrite.io/v1";
        client.config.project = "";
        expect(getUserPhotoUrl({ userId: "user-123" })).toBeUndefined();
    });

    it("calls avatars.getPhoto with explicit userId and 2x retina dimensions", () => {
        const url = getUserPhotoUrl({ userId: "user-123", size: 40 });

        expect(avatars.getPhoto).toHaveBeenCalledWith({
            userId: "user-123",
            width: 80,
            height: 80,
        });
        expect(url).toContain("/avatars/photo?");
        expect(url).toContain("userId=user-123");
    });

    it("omits userId when isTemporary is true", () => {
        getUserPhotoUrl({
            userId: "temp-guest-1",
            isTemporary: true,
            name: "Guest Player",
        });

        expect(avatars.getPhoto).toHaveBeenCalledWith({
            name: "Guest Player",
            width: 80,
            height: 80,
        });
    });

    it("clamps dimensions to Appwrite maximum of 2000px", () => {
        getUserPhotoUrl({ userId: "user-123", size: 1500 });

        expect(avatars.getPhoto).toHaveBeenCalledWith({
            userId: "user-123",
            width: 2000,
            height: 2000,
        });
    });

    it("supports emailHash, truncated name, and quality for guest/unverified users", () => {
        const longName = "A".repeat(150);
        getUserPhotoUrl({
            emailHash: "abc123hash",
            name: `  ${longName}  `,
            size: 32,
            quality: 85,
        });

        expect(avatars.getPhoto).toHaveBeenCalledWith({
            emailHash: "abc123hash",
            name: "A".repeat(128),
            width: 64,
            height: 64,
            quality: 85,
        });
    });

    it("returns undefined if avatars.getPhoto throws", () => {
        avatars.getPhoto.mockImplementationOnce(() => {
            throw new Error("SDK failure");
        });

        expect(getUserPhotoUrl({ userId: "user-123" })).toBeUndefined();
    });
});

describe("getPlayerPhotoUrl", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        client.config.endpoint = "https://mock-appwrite.io/v1";
        client.config.project = "mock-project-id";
    });

    it("returns undefined for temporary guest players", () => {
        expect(
            getPlayerPhotoUrl({
                $id: "temp-1",
                firstName: "Guest",
                isTemporary: true,
            }),
        ).toBeUndefined();
        expect(avatars.getPhoto).not.toHaveBeenCalled();
    });

    it("builds photo URL for regular players using safe display name", () => {
        getPlayerPhotoUrl({ $id: "p1", firstName: "Jane" }, { size: 26 });

        expect(avatars.getPhoto).toHaveBeenCalledWith({
            userId: "p1",
            name: "Jane",
            width: 52,
            height: 52,
        });
    });
});
