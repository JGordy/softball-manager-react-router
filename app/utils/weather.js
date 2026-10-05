import { DateTime } from "luxon";
import { readDocument } from "@/utils/databases.js";

/**
 * Converts wind degrees (0-360) to a cardinal direction string.
 *
 * @param {number} deg - Degrees from 0 to 360
 * @returns {string} Cardinal direction (e.g. "N", "NE", "E", etc.)
 */
export function degreesToCardinal(deg) {
    if (deg == null || Number.isNaN(deg)) return "N";
    const cardinals = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
    return cardinals[index];
}

/**
 * Maps WMO weather interpretation code to Google Weather condition format.
 *
 * @param {number} code - WMO weather code
 * @returns {{ type: string, description: { text: string } }} Weather condition object
 */
export function mapWmoCodeToCondition(code) {
    switch (code) {
        case 0:
            return { type: "CLEAR", description: { text: "Clear" } };
        case 1:
            return { type: "CLEAR", description: { text: "Mainly Clear" } };
        case 2:
            return { type: "CLOUDY", description: { text: "Partly Cloudy" } };
        case 3:
            return { type: "CLOUDY", description: { text: "Overcast" } };
        case 45:
        case 48:
            return { type: "FOG", description: { text: "Fog" } };
        case 51:
            return { type: "DRIZZLE", description: { text: "Light Drizzle" } };
        case 53:
            return { type: "DRIZZLE", description: { text: "Drizzle" } };
        case 55:
            return { type: "DRIZZLE", description: { text: "Heavy Drizzle" } };
        case 56:
        case 57:
            return {
                type: "DRIZZLE",
                description: { text: "Freezing Drizzle" },
            };
        case 61:
            return { type: "RAIN", description: { text: "Light Rain" } };
        case 63:
            return { type: "RAIN", description: { text: "Rain" } };
        case 65:
            return { type: "RAIN", description: { text: "Heavy Rain" } };
        case 66:
        case 67:
            return { type: "RAIN", description: { text: "Freezing Rain" } };
        case 71:
        case 73:
        case 75:
        case 77:
            return { type: "SNOW", description: { text: "Snow" } };
        case 80:
            return {
                type: "RAIN",
                description: { text: "Light Rain Showers" },
            };
        case 81:
            return { type: "RAIN", description: { text: "Rain Showers" } };
        case 82:
            return {
                type: "RAIN",
                description: { text: "Heavy Rain Showers" },
            };
        case 85:
        case 86:
            return { type: "SNOW", description: { text: "Snow Showers" } };
        case 95:
            return {
                type: "THUNDERSTORM",
                description: { text: "Thunderstorm" },
            };
        case 96:
        case 99:
            return {
                type: "THUNDERSTORM",
                description: { text: "Thunderstorm with Hail" },
            };
        default:
            return { type: "CLEAR", description: { text: "Clear" } };
    }
}

/**
 * Fetches historical weather from Open-Meteo Archive API and converts it
 * to Google Weather hourly format.
 *
 * @param {Object} park - Park object containing latitude and longitude
 * @param {DateTime} gameTime - Game time as Luxon UTC DateTime
 * @param {DateTime} sixHoursBefore - Six hours before game start as Luxon UTC DateTime
 * @returns {Promise<Array<Object>>} Formatted hourly weather items
 */
export async function fetchOpenMeteoArchive(park, gameTime, sixHoursBefore) {
    if (!park?.latitude || !park?.longitude) {
        return [];
    }

    try {
        const startDate = sixHoursBefore.toISODate();
        const endDate = gameTime.plus({ hours: 3 }).toISODate();
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${park.latitude}&longitude=${park.longitude}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=UTC`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error(
                `Open-Meteo archive request failed: ${response.status}`,
            );
            return [];
        }

        const data = await response.json();
        const hourly = data?.hourly;
        if (!hourly || !Array.isArray(hourly.time)) {
            return [];
        }

        return hourly.time.map((timeStr, idx) => {
            const startTime = DateTime.fromISO(timeStr, {
                zone: "utc",
            }).toISO();
            const temp = hourly.temperature_2m?.[idx];
            const feelsLike = hourly.apparent_temperature?.[idx];
            const precip = hourly.precipitation?.[idx];
            const code = hourly.weather_code?.[idx];
            const windSpeed = hourly.wind_speed_10m?.[idx];
            const windDir = hourly.wind_direction_10m?.[idx];

            return {
                interval: {
                    startTime,
                },
                temperature: {
                    degrees: temp != null ? Math.round(temp) : undefined,
                },
                feelsLikeTemperature: {
                    degrees:
                        feelsLike != null ? Math.round(feelsLike) : undefined,
                },
                precipitation: {
                    qpf: {
                        quantity: precip != null ? precip : 0,
                    },
                },
                weatherCondition: mapWmoCodeToCondition(code),
                wind: {
                    speed: {
                        value: windSpeed != null ? Math.round(windSpeed) : 0,
                    },
                    direction: {
                        degrees: windDir != null ? Math.round(windDir) : 0,
                        cardinal: degreesToCardinal(windDir),
                    },
                },
            };
        });
    } catch (error) {
        console.error("Error fetching Open-Meteo archive data:", error);
        return [];
    }
}

/**
 * Fetches forecast or historical weather for a game and park location.
 *
 * @param {string} parkId - Park ID
 * @param {Object} game - Game document containing gameDate or dateTime
 * @param {Object} client - Appwrite client
 * @returns {Promise<{ hourly: Array<Object> }|null>} Hourly weather data or null
 */
export const getWeatherData = (parkId, game, client) => {
    const gameDate = game?.gameDate || game?.dateTime;
    if (!gameDate) {
        return Promise.resolve(null);
    }

    const apiKey =
        process.env.VITE_GOOGLE_SERVICES_API_KEY ||
        process.env.GOOGLE_SERVICES_API_KEY ||
        (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_GOOGLE_SERVICES_API_KEY);
    const baseUrl = "https://weather.googleapis.com/v1";

    // Use Luxon for timezone/DST-safe arithmetic. gameDate is stored as an
    // ISO UTC instant in the database; convert to UTC DateTime for math.
    const now = DateTime.utc();
    const gameTime = DateTime.fromISO(gameDate, { zone: "utc" });
    if (!gameTime.isValid) {
        return Promise.resolve(null);
    }
    const sixHoursBefore = gameTime.minus({ hours: 6 });

    // Don't fetch weather for games more than 5 days in the future or older than 1 year
    const diffTime = gameTime.toMillis() - now.toMillis();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 5 || diffDays < -365) {
        return Promise.resolve(null);
    }

    const getForecast = async (park) => {
        const totalHours = 96; // Fetch 96 hours of forecast
        let allForecastHours = [];
        let nextPageToken = null;

        try {
            do {
                let url = `${baseUrl}/forecast/hours:lookup?key=${apiKey}&location.latitude=${park.latitude}&location.longitude=${park.longitude}&hours=${totalHours}&unitsSystem=IMPERIAL`;
                if (nextPageToken) {
                    url += `&pageToken=${nextPageToken}`;
                }

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data.forecastHours) {
                        allForecastHours = allForecastHours.concat(
                            data.forecastHours,
                        );
                    }
                    nextPageToken = data.nextPageToken;
                } else {
                    // Stop pagination on error
                    nextPageToken = null;
                }
            } while (nextPageToken);

            return allForecastHours;
        } catch (error) {
            console.error("Error fetching forecast data:", error);
            return [];
        }
    };

    const getHistory = async (park) => {
        const hoursSinceGame = Math.ceil(
            (now.toMillis() - gameTime.toMillis()) / (1000 * 60 * 60),
        );
        const historyHours = Math.min(24, Math.max(6, hoursSinceGame + 2));
        const url = `${baseUrl}/history/hours:lookup?key=${apiKey}&location.latitude=${park.latitude}&location.longitude=${park.longitude}&hours=${historyHours}&unitsSystem=IMPERIAL`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                return data.historyHours || [];
            }
            return [];
        } catch (error) {
            console.error("Error fetching history data:", error);
            return [];
        }
    };

    return (async () => {
        const park = await readDocument("parks", parkId, [], client);
        if (!park) return null;

        let hourlyData = [];

        if (sixHoursBefore.toMillis() > now.toMillis()) {
            // All in the future
            hourlyData = await getForecast(park);
        } else if (gameTime.toMillis() < now.toMillis()) {
            // All in the past
            if (diffDays < -1) {
                // Beyond Google Weather's 24-hour history window -> use Open-Meteo Archive
                hourlyData = await fetchOpenMeteoArchive(
                    park,
                    gameTime,
                    sixHoursBefore,
                );
            } else {
                hourlyData = await getHistory(park);
                // If Google Weather history returns empty, fall back to Open-Meteo Archive
                if (!hourlyData || hourlyData.length === 0) {
                    hourlyData = await fetchOpenMeteoArchive(
                        park,
                        gameTime,
                        sixHoursBefore,
                    );
                }
            }
        } else {
            // Hybrid
            const forecastData = await getForecast(park);
            const historyData = await getHistory(park);
            hourlyData = [...historyData, ...forecastData];
            if (hourlyData.length === 0) {
                hourlyData = await fetchOpenMeteoArchive(
                    park,
                    gameTime,
                    sixHoursBefore,
                );
            }
        }

        // Filter to the window covering the game.
        // Include from sixHoursBefore through the game duration (up to 3 hours after start)
        const sixHoursBeforeTimestamp = sixHoursBefore.toMillis();
        const gameEndTimestamp = Math.max(
            gameTime.plus({ hours: 3 }).toMillis(),
            gameTime.toMillis(),
        );
        let filteredData = hourlyData.filter((hour) => {
            const hourTimestamp = DateTime.fromISO(hour.interval.startTime, {
                zone: "utc",
            }).toMillis();
            return (
                hourTimestamp >= sixHoursBeforeTimestamp &&
                hourTimestamp <= gameEndTimestamp
            );
        });

        // If the game took place in the past and Google Weather returned no hours
        // within the game window, fall back to Open-Meteo historical archive.
        if (filteredData.length === 0 && gameTime.toMillis() < now.toMillis()) {
            const archiveData = await fetchOpenMeteoArchive(
                park,
                gameTime,
                sixHoursBefore,
            );
            filteredData = archiveData.filter((hour) => {
                const hourTimestamp = DateTime.fromISO(
                    hour.interval.startTime,
                    {
                        zone: "utc",
                    },
                ).toMillis();
                return (
                    hourTimestamp >= sixHoursBeforeTimestamp &&
                    hourTimestamp <= gameEndTimestamp
                );
            });
        }

        return { hourly: filteredData };
    })();
};
