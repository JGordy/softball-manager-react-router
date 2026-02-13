import { getMessaging, isSupported } from "firebase/messaging";
import { getMessagingIfSupported } from "../firebase";

jest.mock("firebase/messaging", () => ({
    getMessaging: jest.fn(() => ({ dummy: "instance" })),
    isSupported: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("firebase/app", () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
}));

describe("firebase utility", () => {
    let originalNavigator;

    beforeAll(() => {
        originalNavigator = global.navigator;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        Object.defineProperty(global, "navigator", {
            value: {
                ...originalNavigator,
                serviceWorker: {},
            },
            configurable: true,
            writable: true,
        });

        if (typeof global.window === "undefined") {
            global.window = {};
        }
    });

    afterAll(() => {
        Object.defineProperty(global, "navigator", {
            value: originalNavigator,
            configurable: true,
            writable: true,
        });
    });

    it("should return null when navigator is undefined", async () => {
        await jest.isolateModules(async () => {
            Object.defineProperty(global, "navigator", {
                value: undefined,
                configurable: true,
                writable: true,
            });

            const {
                getMessagingIfSupported: isolatedGetMessagingIfSupported,
            } = require("../firebase");
            const result = await isolatedGetMessagingIfSupported();
            expect(result).toBeNull();
            expect(isSupported).not.toHaveBeenCalled();
        });
    });

    it("should return null when navigator.serviceWorker is missing", async () => {
        Object.defineProperty(global, "navigator", {
            value: {},
            configurable: true,
            writable: true,
        });

        const result = await getMessagingIfSupported();
        expect(result).toBeNull();
        expect(isSupported).not.toHaveBeenCalled();
    });

    it("should return null when isSupported() returns false", async () => {
        isSupported.mockResolvedValue(false);
        const result = await getMessagingIfSupported();
        expect(result).toBeNull();
        expect(isSupported).toHaveBeenCalled();
    });

    it("should return null and log warning when isSupported() throws", async () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        isSupported.mockRejectedValue(new Error("Firebase breakdown"));
        const result = await getMessagingIfSupported();
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("should return messaging instance when supported", async () => {
        const mockMessaging = { dummy: "instance" };
        isSupported.mockResolvedValue(true);
        getMessaging.mockReturnValue(mockMessaging);
        const result = await getMessagingIfSupported();
        expect(result).toEqual(mockMessaging);
        expect(getMessaging).toHaveBeenCalled();
    });

    it("should return null when window is undefined", async () => {
        await jest.isolateModules(async () => {
            // Mock navigator as undefined to simulate non-browser/SSR environment
            Object.defineProperty(global, "navigator", {
                value: undefined,
                configurable: true,
                writable: true,
            });

            const {
                getMessagingIfSupported: isolatedGetMessagingIfSupported,
            } = require("../firebase");
            const result = await isolatedGetMessagingIfSupported();
            expect(result).toBeNull();
            expect(isSupported).not.toHaveBeenCalled();
        });
    });
});
