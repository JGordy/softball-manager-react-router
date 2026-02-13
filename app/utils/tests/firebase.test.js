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
    const originalNavigator = global.navigator;
    const originalWindow = global.window;

    beforeEach(() => {
        jest.clearAllMocks();
        // Restore standard browser environment
        Object.defineProperty(global, "navigator", {
            value: { ...originalNavigator, serviceWorker: {} },
            configurable: true,
            writable: true,
        });
        global.window = originalWindow;
    });

    afterAll(() => {
        Object.defineProperty(global, "navigator", {
            value: originalNavigator,
            configurable: true,
            writable: true,
        });
        global.window = originalWindow;
    });

    /**
     * Helper to test environment-related failures (SSR, no window, etc)
     * Addressing PR comment: use isolateModulesAsync for async isolation
     */
    const testEnvFailure = (title, setup) => {
        it(title, async () => {
            await jest.isolateModulesAsync(async () => {
                setup();
                const {
                    getMessagingIfSupported: isolatedFn,
                } = require("../firebase");
                expect(await isolatedFn()).toBeNull();
                expect(isSupported).not.toHaveBeenCalled();
            });
        });
    };

    testEnvFailure("should return null in SSR (navigator undefined)", () => {
        Object.defineProperty(global, "navigator", {
            value: undefined,
            configurable: true,
        });
    });

    testEnvFailure("should return null when window is undefined", () => {
        delete global.window;
        Object.defineProperty(global, "navigator", {
            value: undefined,
            configurable: true,
        });
    });

    it("should return null when navigator.serviceWorker is missing", async () => {
        Object.defineProperty(global, "navigator", {
            value: {},
            configurable: true,
        });
        expect(await getMessagingIfSupported()).toBeNull();
        expect(isSupported).not.toHaveBeenCalled();
    });

    it("should return null when isSupported() returns false", async () => {
        isSupported.mockResolvedValue(false);
        expect(await getMessagingIfSupported()).toBeNull();
        expect(isSupported).toHaveBeenCalled();
    });

    it("should return null and log on error", async () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        isSupported.mockRejectedValue(new Error("fail"));
        expect(await getMessagingIfSupported()).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("should return messaging instance when supported", async () => {
        const mock = { dummy: "instance" };
        isSupported.mockResolvedValue(true);
        getMessaging.mockReturnValue(mock);
        expect(await getMessagingIfSupported()).toBe(mock);
    });
});
