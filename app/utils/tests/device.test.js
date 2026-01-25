import { isMobileUserAgent } from "../device";

describe("isMobileUserAgent", () => {
    const createRequest = (userAgent) => ({
        headers: {
            get: (name) => (name === "User-Agent" ? userAgent : null),
        },
    });

    it("returns true for iPhone", () => {
        const req = createRequest(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
        );
        expect(isMobileUserAgent(req)).toBe(true);
    });

    it("returns true for Android", () => {
        const req = createRequest(
            "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36",
        );
        expect(isMobileUserAgent(req)).toBe(true);
    });

    it("returns true for iPad", () => {
        const req = createRequest(
            "Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1",
        );
        expect(isMobileUserAgent(req)).toBe(true);
    });

    it("returns false for Desktop Chrome", () => {
        const req = createRequest(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36",
        );
        expect(isMobileUserAgent(req)).toBe(false);
    });

    it("returns false for empty user agent", () => {
        const req = createRequest("");
        expect(isMobileUserAgent(req)).toBe(false);
    });

    it("returns false when User-Agent header is missing (null)", () => {
        const req = createRequest(null);
        expect(isMobileUserAgent(req)).toBe(false);
    });

    it("returns false for generic bot/crawler", () => {
        const req = createRequest(
            "Googlebot/2.1 (+http://www.google.com/bot.html)",
        );
        expect(isMobileUserAgent(req)).toBe(false);
    });

    it("returns true for unconventional mobile agent", () => {
        const reqOpera = createRequest(
            "Opera/9.80 (J2ME/MIDP; Opera Mini/9.80 (S60; SymbOS; Opera Mobi/23.348; U; en) Presto/2.5.25 Version/10.54",
        );
        expect(isMobileUserAgent(reqOpera)).toBe(true);
    });
});
