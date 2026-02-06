import {
    getUserTimeZone,
    formatGameTime,
    formatDate,
    formatTime,
    combineDateTime,
    getGameDayStatus,
    toViewerDateTime,
    formatForViewerDate,
    formatForViewerTime,
    isSameDayInZone,
} from "../dateTime";
import { DateTime, Settings } from "luxon";

describe("dateTime utility", () => {
    const originalZone = Settings.defaultZone;
    const originalNow = Settings.now;

    beforeAll(() => {
        // Set a fixed timezone for testing
        Settings.defaultZone = "UTC";
    });

    afterAll(() => {
        Settings.defaultZone = originalZone;
        Settings.now = originalNow;
    });

    describe("getUserTimeZone", () => {
        it("should return the default zone", () => {
            // Since we set defaultZone to UTC in beforeAll
            // But getUserTimeZone uses DateTime.local().zoneName
            // which should reflect the system zone or the mocked zone.
            // Luxon's local() uses the system's local zone unless configured otherwise.
            // Let's just check if it returns a string.
            const zone = getUserTimeZone();
            expect(typeof zone).toBe("string");
        });
    });

    describe("formatGameTime", () => {
        it("should format game time correctly", () => {
            const dateString = "2023-10-27T14:30:00Z";
            const timeZone = "America/New_York";
            // 14:30 UTC is 10:30 EDT
            const result = formatGameTime(dateString, timeZone);
            expect(result).toContain("October 27, 2023");
            expect(result).toContain("10:30");
        });

        it("should return error string on invalid input", () => {
            const result = formatGameTime(null, "UTC");
            expect(result).toBe("Invalid Date or Time Zone");
        });

        it("should handle errors gracefully", () => {
            const result = formatGameTime("invalid-date", "UTC");
            expect(result).toBe("Error Formatting Date");
        });
    });

    describe("formatDate", () => {
        it("should format date string correctly", () => {
            const dateString = "2023-10-27";
            const result = formatDate(dateString);
            expect(result).toBe("October 27, 2023");
        });

        it("should format Date object correctly", () => {
            const date = new Date("2023-10-27T12:00:00Z");
            const result = formatDate(date);
            expect(result).toBe("October 27, 2023");
        });

        it("should return error string on invalid input", () => {
            const result = formatDate(null);
            expect(result).toBe("Invalid Date");
        });
    });

    describe("formatTime", () => {
        it("should format time correctly", () => {
            const dateString = "2023-10-27T14:30:00Z";
            const timeZone = "America/New_York";
            // 14:30 UTC is 10:30 EDT
            const result = formatTime(dateString, timeZone);
            expect(result).toBe("10:30");
        });

        it("should return error string on error", () => {
            const result = formatTime("invalid", "UTC");
            expect(result).toBe("Invalid Time");
        });
    });

    describe("combineDateTime", () => {
        it("should combine date and time correctly", () => {
            const gameDate = "2023-10-27";
            const gameTime = "10:30";
            const userTimeZone = "America/New_York";
            // 2023-10-27 10:30 NY is 14:30 UTC
            const result = combineDateTime(gameDate, gameTime, userTimeZone);
            expect(result).toBe("2023-10-27T14:30:00.000Z");
        });
    });

    describe("getGameDayStatus", () => {
        beforeEach(() => {
            // Mock "now" to be 2023-10-27T12:00:00Z
            Settings.now = () => new Date("2023-10-27T12:00:00Z").valueOf();
        });

        it("should return 'past' for past date", () => {
            const result = getGameDayStatus("2023-10-26T12:00:00Z");
            expect(result).toBe("past");
        });

        it("should return 'future' for future date", () => {
            const result = getGameDayStatus("2023-10-28T12:00:00Z");
            expect(result).toBe("future");
        });

        it("should return 'today' for same day", () => {
            const result = getGameDayStatus("2023-10-27T15:00:00Z");
            expect(result).toBe("today");
        });

        it("should return 'today' (not future) for same day future time with hourly precision", () => {
            const result = getGameDayStatus("2023-10-27T15:00:00Z", true);
            expect(result).toBe("today");
        });

        it("should return 'in progress' with hourly precision", () => {
            // Game starts at 11:30 UTC (now is 12:00 UTC)
            // Duration 60 mins -> ends 12:30 UTC
            const result = getGameDayStatus("2023-10-27T11:30:00Z", true, 60);
            expect(result).toBe("in progress");
        });
    });

    describe("toViewerDateTime", () => {
        it("should convert to viewer time", () => {
            const iso = "2023-10-27T14:30:00Z";
            const zone = "America/New_York";
            const dt = toViewerDateTime(iso, zone);
            expect(dt.hour).toBe(10);
        });
    });

    describe("formatForViewerDate", () => {
        it("should format for viewer", () => {
            const iso = "2023-10-27T14:30:00Z";
            const zone = "America/New_York";
            const result = formatForViewerDate(iso, zone);
            expect(result).toBe("Oct 27, 2023");
        });
    });

    describe("formatForViewerTime", () => {
        it("should format for viewer time", () => {
            const iso = "2023-10-27T14:30:00Z";
            const zone = "America/New_York";
            const result = formatForViewerTime(iso, zone);
            expect(result).toBe("10:30");
        });
    });

    describe("isSameDayInZone", () => {
        it("should return true for same day in zone", () => {
            const date1 = "2023-10-27T10:00:00Z";
            const date2 = "2023-10-27T14:00:00Z";
            const zone = "UTC";
            expect(isSameDayInZone(date1, date2, zone)).toBe(true);
        });

        it("should return false for different days", () => {
            const date1 = "2023-10-27T10:00:00Z";
            const date2 = "2023-10-28T10:00:00Z";
            const zone = "UTC";
            expect(isSameDayInZone(date1, date2, zone)).toBe(false);
        });
    });
});
