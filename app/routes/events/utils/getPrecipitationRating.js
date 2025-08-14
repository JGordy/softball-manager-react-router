export default function getPrecipitationChanceRating(precipitation) {
    const precip = precipitation * 100;

    if (precip < 1) return { label: 'None', color: 'blue' };
    if (precip < 20) return { label: 'Light', color: 'green' };
    if (precip < 50) return { label: 'Moderate', color: 'yellow' };
    if (precip < 80) return { label: 'High', color: 'orange' };

    return { label: 'Very High', color: 'red' };
}