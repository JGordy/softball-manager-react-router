import { getFriendlyErrorMessage } from "../errorHandling";

describe("getFriendlyErrorMessage", () => {
    it("returns default message when error is null or undefined", () => {
        expect(getFriendlyErrorMessage(null)).toBe("Failed to generate lineup");
        expect(getFriendlyErrorMessage(undefined)).toBe(
            "Failed to generate lineup",
        );
    });

    it("identifies rate limit and quota errors", () => {
        expect(
            getFriendlyErrorMessage(new Error("429 Too Many Requests")),
        ).toContain("rate limit reached");
        expect(
            getFriendlyErrorMessage(
                new Error("RESOURCE_EXHAUSTED: quota exceeded"),
            ),
        ).toContain("rate limit reached");
    });

    it("identifies overloaded and service unavailable errors", () => {
        expect(
            getFriendlyErrorMessage(new Error("503 Service Unavailable")),
        ).toContain("temporarily overloaded");
        expect(
            getFriendlyErrorMessage(new Error("Model is overloaded")),
        ).toContain("temporarily overloaded");
    });

    it("identifies authentication and api key errors", () => {
        expect(
            getFriendlyErrorMessage(new Error("Invalid API key provided")),
        ).toContain("AI authentication error");
        expect(
            getFriendlyErrorMessage(new Error("401 Unauthorized")),
        ).toContain("AI authentication error");
    });

    it("identifies invalid request errors", () => {
        expect(getFriendlyErrorMessage(new Error("400 Bad Request"))).toContain(
            "Invalid request data",
        );
    });

    it("returns safe fallback without leaking unexpected error message", () => {
        expect(
            getFriendlyErrorMessage(
                new Error("Internal table_users syntax error on col 5"),
            ),
        ).toBe("Failed to generate lineup. Please try again.");
    });
});
