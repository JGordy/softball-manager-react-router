export default function getWindSpeedRating(speed) {
    const windSpeed = Math.round(speed);

    if (windSpeed < 1) return { label: 'Calm', color: 'blue.7' };
    if (windSpeed < 4) return { label: 'Light Air', color: 'blue.5' };
    if (windSpeed < 8) return { label: 'Light Breeze', color: 'blue.2' };
    if (windSpeed < 13) return { label: 'Gentle Breeze', color: 'green' };
    if (windSpeed < 19) return { label: 'Moderate Breeze', color: 'green.3' };
    if (windSpeed < 25) return { label: 'Fresh Breeze', color: 'yellow' };
    if (windSpeed < 32) return { label: 'Strong Breeze', color: 'orange.5' };
    if (windSpeed < 39) return { label: 'Near Gale', color: 'orange' };
    if (windSpeed < 47) return { label: 'Gale', color: 'red.2' };
    if (windSpeed < 55) return { label: 'Strong Gale', color: 'red.5' };
    if (windSpeed < 64) return { label: 'Storm', color: 'red.9' };

    return { label: 'Hurricane Force', color: 'purple' };
}