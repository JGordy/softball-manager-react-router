export default function getUvIndexColor(uvi) {
    const uvIndex = Math.round(uvi);
    if (uvIndex <= 2) return "lime";
    if (uvIndex <= 5) return "yellow";
    if (uvIndex <= 7) return "orange";
    if (uvIndex <= 10) return "red";
    return "purple";
}
