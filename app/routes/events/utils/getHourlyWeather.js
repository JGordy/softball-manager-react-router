export default function getHourlyWeather(weather, gameDate, hoursBefore = 6) {
    if (!weather) return null;

    const gameDateObj = new Date(gameDate);
    const gameTime = gameDateObj.getTime();
    const startTime = gameTime - (hoursBefore * 60 * 60 * 1000);

    const hourlyWeather = weather.filter(hourly => {
        const weatherTime = hourly.dt * 1000;
        return weatherTime >= startTime && weatherTime <= gameTime;
    });

    console.log({ gameDate, gameTime, startTime, hourlyWeather });

    if (!hourlyWeather || hourlyWeather.length === 0) return null;

    const gameTimeWeather = hourlyWeather.pop();

    return { hourly: gameTimeWeather, all: hourlyWeather };
}