/**
 * Calculates the likelihood of a game being rained out based on hourly weather forecasts.
 * It uses a weighted average of the probability of precipitation (pop), giving more
 * weight to forecasts closer to the game time.
 *
 * @param {Array<Object>} weather - An array of hourly weather forecast objects.
 *                                  Each object should contain a 'pop' property (probability of precipitation)
 *                                  and a 'weather' array with forecast details.
 * @returns {{likelihood: number, color: string}} An object containing the calculated percentage and a corresponding color.
 */
export default function getRainoutLikelihood(weather) {
    // If the weather array is missing or empty, there's no data to process.
    if (!weather || !weather.length) {
        return { likelihood: 0, color: "blue" };
    }

    // --- Weighting System ---
    // Create an array of weights. For a list of 6 hours, this creates: [1, 2, 3, 4, 5, 6].
    // This makes the forecast for the first hour have the least impact (weight: 1) and the
    // forecast for the hour of the game have the most impact (weight: 6).
    const weights = weather.map((_, index) => index + 1);

    // Sum up all the weights to get a total. For [1, 2, 3, 4, 5, 6], this would be 21.
    // This total is used later to calculate the weighted average.
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // --- Weighted Probability Calculation ---
    // The .reduce() method iterates over each hourly forecast to calculate a single value: the total weighted probability.
    const weightedPop = weather.reduce((sum, hourlyForecast, index) => {
        // Get the probability of precipitation for the hour, defaulting to 0 if it's not available.
        let pop = hourlyForecast.pop || 0;

        // Safely access the main weather condition (e.g., "Rain", "Clouds") from the nested object.
        const weatherType = hourlyForecast.weather?.[0]?.main;

        // --- Boost probability based on weather conditions ---
        // If the forecast explicitly mentions rain, drizzle, or a thunderstorm,
        // we treat the probability for that hour as being at least 50%.
        if (["Rain", "Drizzle", "Thunderstorm"].includes(weatherType)) {
            pop = Math.max(pop, 0.5);
        }

        // If it's a thunderstorm, the chance of cancellation is very high, so we
        // boost the probability for that hour to be at least 90%.
        if (weatherType === "Thunderstorm") {
            pop = Math.max(pop, 0.9);
        }

        // Multiply the (potentially boosted) probability by its weight and add it to the running total (sum).
        return sum + pop * weights[index];
    }, 0); // Start the sum at 0.

    // --- Final Calculation ---
    // Safety check to prevent dividing by zero.
    if (totalWeight === 0) {
        return { likelihood: 0, color: "blue" };
    }

    // Calculate the final percentage by dividing the total weighted probability by the total weight.
    const rainoutPercentage = (weightedPop / totalWeight) * 100;
    const likelihood = Math.round(rainoutPercentage);
    let color;

    if (likelihood <= 5) {
        color = "blue";
    } else if (likelihood <= 15) {
        color = "green";
    } else if (likelihood <= 30) {
        color = "yellow";
    } else if (likelihood <= 50) {
        color = "orange";
    } else if (likelihood <= 75) {
        color = "red";
    } else {
        color = "purple";
    }

    return { likelihood, color };
}