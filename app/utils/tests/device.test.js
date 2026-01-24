import { isMobileUserAgent } from "../device";

describe("isMobileUserAgent", () => {
    const createRequest = (userAgent) => ({
        headers: {
            get: (name) => (name === "User-Agent" ? userAgent : null),
        },
    });

    test("returns true for iPhone", () => {
        const req = createRequest(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        );
        expect(isMobileUserAgent(req)).toBe(true);
    });

    test("returns true for Android", () => {
        const req = createRequest(
            "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36",
        );
        expect(isMobileUserAgent(req)).toBe(true);
    });

    test("returns true for iPad", () => {
        const req = createRequest(
            "Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1",
        );
        expect(isMobileUserAgent(req)).toBe(true);
    });

    test("returns false for Desktop Chrome", () => {
        const req = createRequest(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36",
        );
        expect(isMobileUserAgent(req)).toBe(false);
    });

    test("returns false for empty user agent", () => {
        const req = createRequest("");
        expect(isMobileUserAgent(req)).toBe(false);
    });
});
