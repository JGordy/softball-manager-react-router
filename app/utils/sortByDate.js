export default function sortByDate(array, dateKey) {
    if (!array || !Array.isArray(array)) {
        return []; // Return empty array if input is invalid
    }

    return array.slice().sort((a, b) => {
        const dateA = new Date(a[dateKey]);
        const dateB = new Date(b[dateKey]);

        // Handle invalid date values gracefully
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
            return 0; // Both invalid, consider them equal
        } else if (isNaN(dateA.getTime())) {
            return 1; // dateA is invalid, dateB is valid, dateB comes first
        } else if (isNaN(dateB.getTime())) {
            return -1; // dateB is invalid, dateA is valid, dateA comes first
        }

        return dateA - dateB;
    });
}