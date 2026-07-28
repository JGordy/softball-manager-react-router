import { render, act } from "@testing-library/react";
import PresenceTracker from "../PresenceTracker";
import { client } from "@/utils/appwrite/client";
import { Realtime } from "appwrite";

// Mock the global client
jest.mock("@/utils/appwrite/client", () => ({
    client: {
        setJWT: jest.fn(),
    },
}));

// Mock the appwrite library
const mockUpsertPresence = jest.fn();
jest.mock("appwrite", () => ({
    Realtime: jest.fn().mockImplementation(() => ({
        upsertPresence: mockUpsertPresence,
    })),
    ID: {
        unique: jest.fn(() => "mock-presence-id"),
    },
    Permission: {
        read: jest.fn(() => "read"),
    },
    Role: {
        users: jest.fn(() => "users"),
    },
}));

describe("PresenceTracker", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("fetches the session JWT and calls upsertPresence when authenticated", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ jwt: "mock-jwt-token" }),
        });

        await act(async () => {
            render(<PresenceTracker />);
        });

        expect(global.fetch).toHaveBeenCalledWith("/api/session");
        expect(client.setJWT).toHaveBeenCalledWith("mock-jwt-token");
        expect(Realtime).toHaveBeenCalledWith(client);
        expect(mockUpsertPresence).toHaveBeenCalledWith({
            presenceId: "mock-presence-id",
            status: "online",
            permissions: ["read"],
        });
    });

    it("does not call setJWT or upsertPresence if fetch fails", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
        });

        await act(async () => {
            render(<PresenceTracker />);
        });

        expect(global.fetch).toHaveBeenCalledWith("/api/session");
        expect(client.setJWT).not.toHaveBeenCalled();
        expect(mockUpsertPresence).not.toHaveBeenCalled();
    });

    it("does not call setJWT or upsertPresence if no JWT is returned", async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValue({ jwt: null }),
        });

        await act(async () => {
            render(<PresenceTracker />);
        });

        expect(client.setJWT).not.toHaveBeenCalled();
        expect(mockUpsertPresence).not.toHaveBeenCalled();
    });
});
