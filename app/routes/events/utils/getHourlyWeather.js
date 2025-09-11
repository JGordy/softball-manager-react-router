import getRainoutLikelihood from "./getRainoutLikelihood";
import calculatePrecipitation from "./calculatePrecipitation";

export default function getHourlyWeather(weather, gameDate) {
    if (!weather) return null;

    const gameTimeWeather = weather[weather.length - 1];

    if (!gameTimeWeather) return null;

    const totalPrecipitation = calculatePrecipitation(weather);
    const rainout = getRainoutLikelihood(weather);

    const { temperature, feelsLikeTemperature, precipitation, weatherCondition, wind, uvIndex } = gameTimeWeather;

    const hourly = {
        temperature,
        feelsLikeTemperature,
        precipitation,
        weatherCondition,
        wind,
        uvIndex,
    };

    return { hourly, rainout, totalPrecipitation };
}
