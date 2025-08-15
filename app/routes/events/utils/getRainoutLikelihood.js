import calculatePrecipitation from "./calculatePrecipitation";

function getLikelihoodColor(likelihood) {
    if (likelihood <= 5) {
        return "blue";
    } else if (likelihood <= 15) {
        return "green";
    } else if (likelihood <= 30) {
        return "yellow";
    } else if (likelihood <= 50) {
        return "orange";
    } else if (likelihood <= 75) {
        return "red";
    } else {
        return "purple";
    }
}

function getWeatherSeverity(hourlyForecast) {
    const weatherType = hourlyForecast.weather?.[0]?.main;
    const rainAmount = hourlyForecast.rain?.["1h"] || 0;
    if (weatherType === "Thunderstorm") return 4;
    if (rainAmount > 2.5) return 3; // Moderate to heavy rain
    if (rainAmount > 0) return 2; // Any measurable rain
    if (weatherType === "Rain" || weatherType === "Drizzle") return 1; // Rain mentioned but no amount
    return 0;
}

function getLikelihoodReason(likelihood, primaryThreat, totalPrecipitation) {
    if (likelihood <= 5) {
        return "Clear conditions expected.";
    }

    const { weather } = primaryThreat;
    const description = weather?.description || "precipitation";

    if (weather?.main === "Thunderstorm") {
        return "Potential for thunderstorms.";
    }

    const totalRainInches = (totalPrecipitation.rain / 25.4).toFixed(2);

    if (totalRainInches > 0) {
        return `Chance of ${description}, with up to ${totalRainInches} inches expected.`;
    }

    if (weather?.main === "Rain" || weather?.main === "Drizzle") {
        return `Chance of ${description}.`;
    }

    // Fallback for when `pop` is high but no specific rain event is named.
    return "Increased chance of precipitation.";
}

/**
 * Calculates the likelihood of a game being rained out based on hourly weather forecasts.
 * It uses a weighted average of the probability of precipitation (pop), giving more
 * weight to forecasts closer to the game time.
 *
 * @param {Array<Object>} weather - An array of hourly weather forecast objects.
 *                                  Each object should contain a 'pop' property (probability of precipitation)
 *                                  and a 'weather' array with forecast details.
 * @returns {{likelihood: number, color: string, reason: string}} An object containing the calculated percentage, a corresponding color, and a reason for the score.
 */
export default function getRainoutLikelihood(weather) {
    // If the weather array is missing or empty, there's no data to process.
    if (!weather || !weather.length) {
        return {
            likelihood: 0,
            color: "blue",
            reason: "No weather data available.",
        };
    }

    // --- Weighting System ---
    const weights = weather.map((_, index) => index + 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // Keep track of the hour with the most significant precipitation threat.
    let primaryThreat = { weather: null, rainAmount: 0, severity: 0 };

    // --- Weighted Probability Calculation ---
    const weightedPop = weather.reduce((sum, hourlyForecast, index) => {
        let pop = hourlyForecast.pop || 0;
        const weatherType = hourlyForecast.weather?.[0]?.main;
        const rainAmount = hourlyForecast.rain?.["1h"] || 0;

        // --- Boost probability based on weather conditions ---
        if (["Rain", "Drizzle", "Thunderstorm"].includes(weatherType)) {
            pop = Math.max(pop, 0.5);
        }
        if (weatherType === "Thunderstorm") {
            pop = Math.max(pop, 0.9);
        }

        // --- Adjust for volume ---
        // If the pop is high but rain amount is negligible, reduce the impact.
        if (pop > 0.5 && rainAmount > 0 && rainAmount < 0.254) {
            pop = pop * 0.5; // Halve the impact of this hour
        }

        // Identify the hour with the most severe weather to use for the 'reason' text.
        const severity = getWeatherSeverity(hourlyForecast);
        const currentThreat = {
            weather: hourlyForecast.weather,
            rainAmount: rainAmount,
            severity: severity,
        };

        if (currentThreat.severity > primaryThreat.severity) {
            primaryThreat = currentThreat;
        } else if (
            currentThreat.severity === primaryThreat.severity &&
            currentThreat.severity > 0
        ) {
            // If severity is the same, the one with more rain is the primary threat.
            if (currentThreat.rainAmount > primaryThreat.rainAmount) {
                primaryThreat = currentThreat;
            }
        }

        return sum + pop * weights[index];
    }, 0);

    const totalPrecipitation = calculatePrecipitation(weather);

    // --- Final Calculation ---
    if (totalWeight === 0) {
        return {
            likelihood: 0,
            color: "blue",
            reason: "Clear conditions expected.",
        };
    }

    const rainoutPercentage = (weightedPop / totalWeight) * 100;
    const likelihood = Math.round(rainoutPercentage);
    const color = getLikelihoodColor(likelihood);
    const reason = getLikelihoodReason(likelihood, primaryThreat, totalPrecipitation);

    return { likelihood, color, reason };
}