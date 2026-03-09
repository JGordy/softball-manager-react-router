import { formatPhoneNumber } from "../phone";

describe("formatPhoneNumber", () => {
    it("returns an empty string if no phone number is provided", () => {
        expect(formatPhoneNumber(null)).toBe("");
        expect(formatPhoneNumber(undefined)).toBe("");
        expect(formatPhoneNumber("")).toBe("");
    });

    it("formats a standard US E.164 phone number correctly", () => {
        expect(formatPhoneNumber("+15551234567")).toBe("(555) 123-4567");
        expect(formatPhoneNumber("15551234567")).toBe("(555) 123-4567");
    });

    it("returns the original string for non-standard or international numbers", () => {
        expect(formatPhoneNumber("+447700900000")).toBe("+447700900000");
        expect(formatPhoneNumber("5551234567")).toBe("5551234567"); // Too short for US check
        expect(formatPhoneNumber("1555123456")).toBe("1555123456"); // Too short for US check
    });

    it("cleans non-digit characters before formatting", () => {
        expect(formatPhoneNumber("+1 (555) 123-4567")).toBe("(555) 123-4567");
    });
});
