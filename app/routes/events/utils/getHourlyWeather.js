export default function getHourlyWeather(weather, gameDate, hoursBefore = 6) {
    if (!weather || !weather.hourly) return null;

    const gameDateObj = new Date(gameDate);
    const gameTime = gameDateObj.getTime();
    const startTime = gameTime - (hoursBefore * 60 * 60 * 1000);

    const hourlyWeather = weather.hourly.filter(hourly => {
        const weatherTime = hourly.dt * 1000;
        return weatherTime >= startTime && weatherTime <= gameTime;
    });

    if (!hourlyWeather || hourlyWeather.length === 0) return null;

    return hourlyWeather;
}