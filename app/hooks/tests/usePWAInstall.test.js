import { renderHook, act } from "@testing-library/react";
import { usePWAInstall } from "../usePWAInstall";

describe("usePWAInstall", () => {
    let events = {};

    beforeEach(() => {
        events = {};
        jest.spyOn(window, "addEventListener").mockImplementation(
            (event, cb) => {
                events[event] = cb;
            },
        );
        jest.spyOn(window, "removeEventListener").mockImplementation(
            (event, cb) => {
                if (events[event] === cb) {
                    delete events[event];
                }
            },
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should initialize isInstallable as false", () => {
        const { result } = renderHook(() => usePWAInstall());
        expect(result.current.isInstallable).toBe(false);
    });

    it("should set isInstallable to true and prevent default when 'beforeinstallprompt' fires", () => {
        const { result } = renderHook(() => usePWAInstall());

        const mockEvent = {
            preventDefault: jest.fn(),
        };

        act(() => {
            if (events.beforeinstallprompt) {
                events.beforeinstallprompt(mockEvent);
            }
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(result.current.isInstallable).toBe(true);
    });

    it("should show prompt and reset state when promptInstall is called", async () => {
        const { result } = renderHook(() => usePWAInstall());

        const mockEvent = {
            preventDefault: jest.fn(),
            prompt: jest.fn(),
            userChoice: Promise.resolve({ outcome: "accepted" }),
        };

        // Trigger event
        act(() => {
            if (events.beforeinstallprompt) {
                events.beforeinstallprompt(mockEvent);
            }
        });

        expect(result.current.isInstallable).toBe(true);

        // Install
        let outcome;
        await act(async () => {
            outcome = await result.current.promptInstall();
        });

        expect(mockEvent.prompt).toHaveBeenCalled();
        expect(result.current.isInstallable).toBe(false);
        expect(outcome).toBe("accepted");
    });

    it("should return null if promptInstall is called without a deferred prompt", async () => {
        const { result } = renderHook(() => usePWAInstall());

        let outcome;
        await act(async () => {
            outcome = await result.current.promptInstall();
        });

        expect(outcome).toBeNull();
    });

    it("should handle the dismissed outcome correctly", async () => {
        const { result } = renderHook(() => usePWAInstall());

        const mockEvent = {
            preventDefault: jest.fn(),
            prompt: jest.fn(),
            userChoice: Promise.resolve({ outcome: "dismissed" }),
        };

        // Trigger event
        act(() => {
            if (events.beforeinstallprompt) {
                events.beforeinstallprompt(mockEvent);
            }
        });

        expect(result.current.isInstallable).toBe(true);

        // Install
        let outcome;
        await act(async () => {
            outcome = await result.current.promptInstall();
        });

        expect(mockEvent.prompt).toHaveBeenCalled();
        expect(result.current.isInstallable).toBe(false);
        expect(outcome).toBe("dismissed");
    });
});
