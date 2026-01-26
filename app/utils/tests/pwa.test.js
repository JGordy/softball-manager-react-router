import { isStandalone } from "../pwa";

describe("isStandalone", () => {
    let originalMatchMedia;
    let originalNavigator;

    beforeEach(() => {
        originalMatchMedia = window.matchMedia;
        originalNavigator = window.navigator;

        // Mock matchMedia defaults
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: jest.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });

        // Mock navigator defaults
        // We clone navigator properties to avoid "Cannot redefine property: navigator" if it was non-configurable,
        // but typically in JSDOM it is configurable. We'll check if we can just overwrite props.
        // If window.navigator is read-only in JSDOM, we might need a different approach,
        // but usually defineProperty works on window.
        Object.defineProperty(window, "navigator", {
            writable: true,
            value: { ...window.navigator, standalone: undefined },
        });
    });

    afterEach(() => {
        // Restore
        if (originalMatchMedia) window.matchMedia = originalMatchMedia;
        if (originalNavigator) {
            Object.defineProperty(window, "navigator", {
                writable: true,
                value: originalNavigator,
            });
        }
    });

    it("returns true when display-mode is standalone", () => {
        window.matchMedia.mockImplementation((query) => ({
            matches: query === "(display-mode: standalone)",
        }));

        expect(isStandalone()).toBe(true);
    });

    it("returns true when navigator.standalone is true (iOS)", () => {
        Object.defineProperty(window, "navigator", {
            writable: true,
            value: { ...window.navigator, standalone: true },
        });
        expect(isStandalone()).toBe(true);
    });

    it("returns false when neither condition is met", () => {
        expect(isStandalone()).toBe(false);
    });

    it("returns false when navigator.standalone is false", () => {
        Object.defineProperty(window, "navigator", {
            writable: true,
            value: { ...window.navigator, standalone: false },
        });
        expect(isStandalone()).toBe(false);
    });
});
