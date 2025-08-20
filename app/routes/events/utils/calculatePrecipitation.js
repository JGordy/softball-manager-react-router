export default function calculatePrecipitation(hourlyWeather) {
    if (!hourlyWeather || hourlyWeather.length === 0) {
        return { rain: 0, snow: 0 };
    }

    return hourlyWeather.reduce((acc, hour) => {
        if (hour.precipitation?.qpf?.quantity) {
            acc.rain += hour.precipitation.qpf.quantity;
        }
        if (hour.precipitation?.snowQpf?.quantity) {
            acc.snow += hour.precipitation.snowQpf.quantity;
        }
        return acc;
    }, { rain: 0, snow: 0 });
}