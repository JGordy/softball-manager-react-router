import { DateTime } from "luxon";
import getRainoutLikelihood from "./getRainoutLikelihood";
import calculatePrecipitation from "./calculatePrecipitation";

export default function getHourlyWeather(weather, gameDate) {
    if (!weather || !Array.isArray(weather) || weather.length === 0)
        return null;

    // Robustly parse the gameDate. The loader should pass an ISO string,
    // but depending on how data was stored it may be a JS Date, a number,
    // or an ISO that Luxon fails to parse with setZone. Try a few fallbacks
    // so we don't end up with NaN and never match an hourly entry.
    let gameDateTime;
    if (typeof gameDate === "string") {
        gameDateTime = DateTime.fromISO(gameDate, { setZone: true });
        if (!gameDateTime.isValid) {
            // try forcing UTC
            gameDateTime = DateTime.fromISO(gameDate, { zone: "utc" });
        }
        if (!gameDateTime.isValid) {
            // try parsing as a number string
            const asNumber = Number(gameDate);
            if (!Number.isNaN(asNumber)) {
                gameDateTime = DateTime.fromMillis(asNumber);
            }
        }
    } else if (gameDate instanceof Date) {
        gameDateTime = DateTime.fromJSDate(gameDate);
    } else if (typeof gameDate === "number") {
        gameDateTime = DateTime.fromMillis(gameDate);
    } else if (gameDate && typeof gameDate.toMillis === "function") {
        // Luxon DateTime passed directly
        try {
            gameDateTime = gameDate;
        } catch (e) {
            gameDateTime = null;
        }
    }

    // Last resort: attempt JS Date parsing
    if (!gameDateTime || !gameDateTime.isValid) {
        const d = new Date(gameDate);
        if (!Number.isNaN(d.getTime())) {
            gameDateTime = DateTime.fromJSDate(d);
        }
    }

    if (!gameDateTime || !gameDateTime.isValid) {
        // If we still can't parse the game date, fall back to using the
        // last hour so we at least return something instead of null.
        const fallbackHour = weather[weather.length - 1];
        const totalPrecipitation = calculatePrecipitation(weather);
        const rainout = getRainoutLikelihood(weather);

        if (!fallbackHour) return null;

        const {
            temperature,
            feelsLikeTemperature,
            precipitation,
            weatherCondition,
            wind,
            uvIndex,
        } = fallbackHour;

        return {
            hourly: {
                temperature,
                feelsLikeTemperature,
                precipitation,
                weatherCondition,
                wind,
                uvIndex,
            },
            rainout,
            totalPrecipitation,
        };
    }

    const gameTimeMillis = gameDateTime.toMillis();

    // Find the hourly entry whose interval.startTime is the closest to, and
    // not after, the game time. If none are before the game time, fall back
    // to the closest hour (future) so we still show something when data is
    // slightly misaligned.
    let chosenHour = null;
    let chosenDiff = Number.POSITIVE_INFINITY;

    for (const hour of weather) {
        const hourStart = DateTime.fromISO(hour.interval.startTime, {
            setZone: true,
        }).toMillis();
        // prefer hours that are <= game time
        if (hourStart <= gameTimeMillis) {
            const diff = Math.abs(gameTimeMillis - hourStart);
            if (diff < chosenDiff) {
                chosenHour = hour;
                chosenDiff = diff;
            }
        }
    }

    // If nothing was before or equal to game time, pick the closest hour
    // (handles edge cases where the data starts slightly after the game time)
    if (!chosenHour) {
        for (const hour of weather) {
            const hourStart = DateTime.fromISO(hour.interval.startTime, {
                setZone: true,
            }).toMillis();
            const diff = Math.abs(gameTimeMillis - hourStart);
            if (diff < chosenDiff) {
                chosenHour = hour;
                chosenDiff = diff;
            }
        }
    }

    if (!chosenHour) return null;

    const totalPrecipitation = calculatePrecipitation(weather);
    const rainout = getRainoutLikelihood(weather);

    const {
        temperature,
        feelsLikeTemperature,
        precipitation,
        weatherCondition,
        wind,
        uvIndex,
    } = chosenHour;

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
