import { getFirstVisible } from "../onboardingSteps";

describe("getFirstVisible", () => {
    let originalDocument;

    beforeAll(() => {
        originalDocument = global.document;
    });

    afterEach(() => {
        global.document = originalDocument;
        document.body.innerHTML = "";
    });

    it("should return the fallback if document is undefined (SSR)", () => {
        // Temporarily delete document from global
        delete global.document;

        const result = getFirstVisible(".some-class", "#fallback-id");
        expect(result).toBe("#fallback-id");
    });

    it("should return fallback if no elements match the selector", () => {
        const result = getFirstVisible(".non-existent-class", "#fallback");
        expect(result).toBe("#fallback");
    });

    it("should return fallback if matching elements exist but are not visible", () => {
        document.body.innerHTML = `
            <div class="test-target" style="display: none;">Invisible 1</div>
            <div class="test-target" style="width: 0; height: 0;">Invisible 2</div>
        `;

        // Mock offsetWidth / offsetHeight to be 0 for JSDOM
        const elements = document.querySelectorAll(".test-target");
        Object.defineProperty(elements[0], "offsetWidth", {
            value: 0,
            configurable: true,
        });
        Object.defineProperty(elements[0], "offsetHeight", {
            value: 0,
            configurable: true,
        });
        Object.defineProperty(elements[1], "offsetWidth", {
            value: 0,
            configurable: true,
        });
        Object.defineProperty(elements[1], "offsetHeight", {
            value: 0,
            configurable: true,
        });

        const result = getFirstVisible(".test-target", "fallback-string");
        expect(result).toBe("fallback-string");
    });

    it("should return the first visible element if one is found", () => {
        document.body.innerHTML = `
            <div class="test-target" id="el1">Invisible</div>
            <div class="test-target" id="el2">Visible</div>
            <div class="test-target" id="el3">Visible 2</div>
        `;

        const elements = document.querySelectorAll(".test-target");
        // Mock dimensions
        Object.defineProperty(elements[0], "offsetWidth", {
            value: 0,
            configurable: true,
        });
        Object.defineProperty(elements[0], "offsetHeight", {
            value: 0,
            configurable: true,
        });

        Object.defineProperty(elements[1], "offsetWidth", {
            value: 100,
            configurable: true,
        });
        Object.defineProperty(elements[1], "offsetHeight", {
            value: 50,
            configurable: true,
        });

        Object.defineProperty(elements[2], "offsetWidth", {
            value: 200,
            configurable: true,
        });
        Object.defineProperty(elements[2], "offsetHeight", {
            value: 80,
            configurable: true,
        });

        const result = getFirstVisible(".test-target");
        expect(result).toBe(elements[1]);
    });
});
