import { DateTime } from "luxon";

export default function sortByDate(array, dateKey) {
    if (!array || !Array.isArray(array)) {
        return []; // Return empty array if input is invalid
    }

    return array.slice().sort((a, b) => {
        const dateA = DateTime.fromISO(a[dateKey], { zone: "utc" });
        const dateB = DateTime.fromISO(b[dateKey], { zone: "utc" });

        const aValid = dateA.isValid;
        const bValid = dateB.isValid;

        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;

        return dateA.toMillis() - dateB.toMillis();
    });
}
