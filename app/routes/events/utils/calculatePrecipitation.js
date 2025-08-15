export default function calculatePrecipitation(hourlyWeather) {
    if (!hourlyWeather || hourlyWeather.length === 0) {
        return { rain: 0, snow: 0 };
    }

    return hourlyWeather.reduce((acc, hour) => {
        if (hour.rain) {
            acc.rain += hour.rain['1h'] || 0;
        }
        if (hour.snow) {
            acc.snow += hour.snow['1h'] || 0;
        }
        return acc;
    }, { rain: 0, snow: 0 });
}
