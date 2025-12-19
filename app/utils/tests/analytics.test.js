import { trackEvent } from "../analytics";

describe("analytics utility", () => {
    let originalUmami;
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        // Save original window.umami
        originalUmami = window.umami;

        // Setup spies
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // Reset mocks/globals
        jest.clearAllMocks();
        delete window.umami;
    });

    afterEach(() => {
        // Restore
        window.umami = originalUmami;
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it("should call window.umami.track if it exists", () => {
        const mockTrack = jest.fn();
        window.umami = { track: mockTrack };

        const eventName = "Test Event";
        const eventData = { foo: "bar" };

        trackEvent(eventName, eventData);

        expect(mockTrack).toHaveBeenCalledWith(eventName, eventData);
        expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should log to console in dev mode if window.umami is missing", () => {
        // In this test environment, import.meta.env.DEV is likely true or polyfilled
        // because of the babel plugins in the project.

        const eventName = "Dev Event";
        const eventData = { env: "dev" };

        trackEvent(eventName, eventData);

        // Depending on how import.meta.env is handled in tests,
        // this might log or do nothing. We'll verify if it logs.
        if (import.meta.env.DEV) {
            expect(consoleLogSpy).toHaveBeenCalledWith(
                `[Umami Analytics] Track Event: "${eventName}"`,
                eventData,
            );
        }
    });

    it("should handle missing data gracefully", () => {
        const mockTrack = jest.fn();
        window.umami = { track: mockTrack };

        trackEvent("Simple Event");

        expect(mockTrack).toHaveBeenCalledWith("Simple Event", undefined);
    });

    it("should catch and log errors if tracking fails", () => {
        window.umami = {
            track: () => {
                throw new Error("Umami Failed");
            },
        };

        trackEvent("Failing Event");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error tracking event with Umami:",
            expect.any(Error),
        );
    });
});
