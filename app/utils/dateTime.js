import { DateTime } from "luxon";

export function getUserTimeZone() {
    try {
        // Use Luxon to get the local zone name when available
        const zone = DateTime.local().zoneName;
        return zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.error("Error getting user time zone:", error);
        return "UTC"; // Default to UTC if unable to determine
    }
}

export function formatGameTime(dateString, timeZone, locale = "en-US") {
    if (!dateString || !timeZone) {
        return "Invalid Date or Time Zone";
    }

    try {
        // Parse the incoming ISO (or similar) date and render it in the
        // requested timezone using Luxon. We preserve the locale for
        // localized month/day names.
        const dt = DateTime.fromISO(dateString, { setZone: true }).setZone(
            timeZone,
        );

        return dt.setLocale(locale).toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Error Formatting Date";
    }
}

export function formatDate(date, locale = "en-US") {
    if (!date) {
        return "Invalid Date";
    }

    try {
        // Accept either a JS Date or an ISO string
        const dt =
            date instanceof Date
                ? DateTime.fromJSDate(date)
                : DateTime.fromISO(date);
        return dt.setLocale(locale).toLocaleString({
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Error Formatting Date";
    }
}

export function formatTime(dateString, timeZone = "UTC") {
    try {
        const dt = DateTime.fromISO(dateString, { setZone: true }).setZone(
            timeZone,
        );
        // Return 24-hour format HH:mm
        return dt.toFormat("HH:mm");
    } catch (error) {
        console.error("Error formatting time:", error);
        return "Invalid Time";
    }
}

export const combineDateTime = (gameDate, gameTime, userTimeZone) => {
    // Parse date components from YYYY-MM-DD
    const [year, month, day] = gameDate.split("-").map(Number);
    const [hour, minute] = gameTime.split(":").map(Number);

    const zone = userTimeZone || getUserTimeZone() || "UTC";

    // Build a zoned DateTime from the wall-clock components, then convert to UTC ISO
    const dt = DateTime.fromObject(
        { year, month, day, hour, minute },
        { zone },
    );

    return dt.toUTC().toISO();
};

export function getGameDayStatus(
    gameDateString,
    useHourlyPrecision = false,
    durationMinutes = 60,
) {
    if (!gameDateString) {
        console.error("Invalid date string provided to getGameDayStatus");
        return "invalid"; // Or throw an error, or return a specific status
    }

    try {
        const gameDate = DateTime.fromISO(gameDateString, { setZone: true });
        // Normalize the game date into the viewer's zone so "day" comparisons
        // are done on the same calendar (avoids UTC vs local day mismatches).
        const viewerZone = getUserTimeZone() || DateTime.local().zoneName;
        const gameDateInViewerZone = gameDate.setZone(viewerZone);
        const now = DateTime.local();

        const gameDay = gameDateInViewerZone.startOf("day");
        const today = now.startOf("day");

        if (gameDay < today) return "past";
        if (gameDay > today) return "future";

        // Same day
        if (useHourlyPrecision) {
            // Use the viewer-zone-normalized DateTime to compute start/end so
            // comparisons align with what the viewer expects.
            const gameStart = gameDateInViewerZone.toMillis();
            const nowMs = now.toMillis();
            const gameEnd = gameDateInViewerZone
                .plus({ minutes: durationMinutes })
                .toMillis();

            if (nowMs >= gameStart && nowMs < gameEnd) return "in progress";
            if (nowMs >= gameEnd) return "past";
            return "future";
        }

        return "today";
    } catch (error) {
        console.error("Error processing date in getGameDayStatus:", error);
        return "error"; // Or throw an error
    }
}

// --- Viewer helpers ---
// Convert stored UTC ISO -> viewer DateTime (use eventZone if provided, otherwise viewer's zone)
export function toViewerDateTime(isoUtcString, eventZone) {
    if (!isoUtcString) return null;

    try {
        // If isoUtcString contains a zone (Z or offset), parse as that, then set to target zone
        const utc = DateTime.fromISO(isoUtcString, { zone: "utc" });
        const targetZone = eventZone || getUserTimeZone();
        return utc.setZone(targetZone);
    } catch (error) {
        console.error("Error converting to viewer DateTime:", error);
        return null;
    }
}

export function formatForViewerDate(isoUtcString, eventZone, locale = "en-US") {
    const dt = toViewerDateTime(isoUtcString, eventZone);
    if (!dt) return "Invalid Date";
    return dt.setLocale(locale).toLocaleString();
}

export function formatForViewerTime(
    isoUtcString,
    eventZone,
    opts = { format: "HH:mm" },
) {
    const dt = toViewerDateTime(isoUtcString, eventZone);
    if (!dt) return "Invalid Time";
    return dt.toFormat(opts.format || "HH:mm");
}

export function isSameDayInZone(isoUtcStringA, isoUtcStringB, zone) {
    try {
        const a = DateTime.fromISO(isoUtcStringA, { zone: "utc" })
            .setZone(zone || getUserTimeZone())
            .startOf("day");
        const b = DateTime.fromISO(isoUtcStringB, { zone: "utc" })
            .setZone(zone || getUserTimeZone())
            .startOf("day");
        return a.equals(b);
    } catch (error) {
        console.error("Error comparing days:", error);
        return false;
    }
}
