import getHourlyWeather from './getHourlyWeather';

export default function getGameDateWeather(gameDate, weather) {
    if (!weather?.hourly) return {};

    const hourlyWeatherResult = getHourlyWeather(weather.hourly, gameDate);
    if (!hourlyWeatherResult) return {};

    const { hourly, rainout, totalPrecipitation } = hourlyWeatherResult;

    return {
        hourly,
        rainout,
        totalPrecipitation,
    };
}