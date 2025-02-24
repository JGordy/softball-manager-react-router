
export function getUserTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.error('Error getting user time zone:', error);
        return 'UTC'; // Default to UTC if unable to determine
    }
}

export function formatGameTime(dateString, timeZone, locale = 'en-US') {
    if (!dateString || !timeZone) {
        return 'Invalid Date or Time Zone';
    }

    try {
        const date = new Date(Date.UTC(
            parseInt(dateString.substring(0, 4)),
            parseInt(dateString.substring(5, 7)) - 1,
            parseInt(dateString.substring(8, 10)),
            parseInt(dateString.substring(11, 13)),
            parseInt(dateString.substring(14, 16)),
            parseInt(dateString.substring(17, 19))
        ));

        const formatter = new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZone: timeZone,
        });

        const formattedTime = formatter.format(date);
        return formattedTime;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error Formatting Date';
    }
}

export function formatDate(date, locale = 'en-US') {
    if (!date) {
        return 'Invalid Date';
    }

    try {
        const formatter = new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        return formatter.format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error Formatting Date';
    }
}

export const combineDateTime = (gameDate, gameTime, userTimeZone) => {
    const date = new Date(gameDate);
    const [hours, minutes] = gameTime.split(':').map(Number);

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimeZone || getUserTimeZone(),
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false, // Ensure 24-hour format
    });

    const dateParts = formatter.formatToParts(date);
    const year = dateParts.find((part) => part.type === 'year').value;
    const month = dateParts.find((part) => part.type === 'month').value - 1;
    const day = dateParts.find((part) => part.type === 'day').value;

    const localDate = new Date(year, month, day, hours, minutes);

    return localDate.toISOString();
};