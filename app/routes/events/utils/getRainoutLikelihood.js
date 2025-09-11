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

function getLikelihoodReason(likelihood, primaryThreat, totalPrecipitation, weightedThunderstormThreat) {
    if (likelihood <= 5) {
        return "Clear conditions expected";
    }

    const { weatherCondition, thunderstormProbability } = primaryThreat;
    const description = weatherCondition?.description?.text || "precipitation";
    const totalRainInches = parseFloat(totalPrecipitation.rain.toFixed(2));

    // Priority 1: Imminent thunderstorm threat
    if (weightedThunderstormThreat > 20) {
        return `High chance of thunderstorms (${Math.round(weightedThunderstormThreat)}%)`;
    }

    // Priority 2: Significant rainfall accumulation making field conditions poor
    if (totalRainInches > 0.25) {
        return `Potential for Poor field conditions due to ${totalRainInches} inches of precipitation.`;
    }

    // Priority 3: Thunderstorms that occurred earlier in the day
    if (thunderstormProbability > 30) {
        // If there was also rain, mention it.
        if (totalRainInches > 0.1) {
            return `Potential for thunderstorms earlier in the day, with ${totalRainInches} inches of accumulation.`;
        }
        return `Potential for thunderstorms earlier in the day.`;
    }

    // Priority 4: General rain forecast
    if (
        weatherCondition?.type === "RAIN" ||
        weatherCondition?.type === "DRIZZLE" ||
        weatherCondition?.type === "SNOW"
    ) {
        return `Chance of ${description}.`;
    }

    // Fallback
    return "Increased chance of precipitation";
}

/**
 * Calculates the likelihood of a game being rained out based on hourly weather forecasts.
 * It considers weighted probability of precipitation, total accumulation, and thunderstorm risk.
 *
 * @param {Array<Object>} weather - An array of hourly weather forecast objects.
 * @returns {{likelihood: number, color: string, reason: string}} An object containing the calculated percentage, a corresponding color, and a reason for the score.
 */
export default function getRainoutLikelihood(weather) {
    if (!weather || !weather.length) {
        return {
            likelihood: 0,
            color: "blue",
            reason: "No weather data available",
        };
    }

    const weights = weather.map((_, index) => Math.pow(index + 1, 2));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let primaryThreat = {
        weatherCondition: null,
        rainAmount: 0,
        thunderstormProbability: 0,
    };

    let weightedPop = 0;
    let weightedThunderstorm = 0;

    weather.forEach((hourlyForecast, index) => {
        const pop = hourlyForecast.precipitation?.probability?.percent || 0;
        const thunderstorm = hourlyForecast.thunderstormProbability || 0;

        weightedPop += (pop / 100) * weights[index];
        weightedThunderstorm += thunderstorm * weights[index];

        if (hourlyForecast.thunderstormProbability > primaryThreat.thunderstormProbability) {
            primaryThreat = {
                weatherCondition: hourlyForecast.weatherCondition,
                rainAmount: hourlyForecast.precipitation?.qpf?.quantity || 0,
                thunderstormProbability: hourlyForecast.thunderstormProbability || 0,
            };
        }
    });

    const totalPrecipitation = calculatePrecipitation(weather);

    if (totalWeight === 0) {
        return {
            likelihood: 0,
            color: "blue",
            reason: "Clear conditions expected",
        };
    }

    let rainoutPercentage = (weightedPop / totalWeight) * 100;

    // --- Field Condition Factor ---
    const totalRainInches = totalPrecipitation.rain;
    let fieldConditionFactor = 1.0;
    if (totalRainInches > 0.75) {
        fieldConditionFactor = 2.0;
    } else if (totalRainInches > 0.5) {
        fieldConditionFactor = 1.75;
    } else if (totalRainInches > 0.25) {
        fieldConditionFactor = 1.5;
    } else if (totalRainInches > 0.1) {
        fieldConditionFactor = 1.2;
    }
    rainoutPercentage *= fieldConditionFactor;

    // --- Weighted Thunderstorm Threat ---
    const weightedThunderstormThreat = weightedThunderstorm / totalWeight;
    if (weightedThunderstormThreat > 5) {
        rainoutPercentage += weightedThunderstormThreat;
    }

    const likelihood = Math.min(100, Math.round(rainoutPercentage));
    const color = getLikelihoodColor(likelihood);
    const reason = getLikelihoodReason(likelihood, primaryThreat, totalPrecipitation, weightedThunderstormThreat);

    return { likelihood, color, reason };
}
