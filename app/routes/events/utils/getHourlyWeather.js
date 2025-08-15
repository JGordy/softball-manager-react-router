import getRainoutLikelihood from "./getRainoutLikelihood";
import calculatePrecipitation from "./calculatePrecipitation";

export default function getHourlyWeather(weather, gameDate, hoursBefore = 6) {
    if (!weather) return null;

    const gameDateObj = new Date(gameDate);
    const gameTime = gameDateObj.getTime();
    const startTime = gameTime - (hoursBefore * 60 * 60 * 1000);

    const hourlyWeather = weather.filter(hourly => {
        const weatherTime = hourly.dt * 1000;
        return weatherTime >= startTime && weatherTime <= gameTime;
    });

    if (!hourlyWeather || hourlyWeather.length === 0) return null;

    const totalPrecipitation = calculatePrecipitation(hourlyWeather);

    const gameTimeWeather = hourlyWeather.pop();

    const rainout = getRainoutLikelihood(hourlyWeather);

    return { hourly: gameTimeWeather, rainout, totalPrecipitation };
}