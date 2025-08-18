export default function calculatePrecipitation(hourlyWeather) {
    if (!hourlyWeather || hourlyWeather.length === 0) {
        return { rain: 0, snow: 0 };
    }

    return hourlyWeather.reduce((acc, hour) => {
        if (hour.precipitation?.qpf?.value) {
            acc.rain += hour.precipitation.qpf.value;
        }
        if (hour.precipitation?.snowQpf?.value) {
            acc.snow += hour.precipitation.snowQpf.value;
        }
        return acc;
    }, { rain: 0, snow: 0 });
}
