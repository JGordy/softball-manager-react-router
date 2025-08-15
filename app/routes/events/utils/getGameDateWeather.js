import getDailyWeather from './getDailyWeather';
import getHourlyWeather from './getHourlyWeather';

export default function getGameDateWeather(gameDate, weather) {
    if (!weather) return {};

    if (weather.daily) {
        return {
            gameDayWeather: getDailyWeather(weather.daily, gameDate),
            type: 'daily',
        };
    } else if (weather.hourly) {
        const { hourly, rainout, totalPrecipitation } = getHourlyWeather(weather.hourly, gameDate);

        return {
            gameDayWeather: hourly,
            rainout,
            type: 'hourly',
            totalPrecipitation,
        };
    }

    return {};
}