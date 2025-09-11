import { Query } from "@/appwrite";
import { listDocuments, readDocument } from "@/utils/databases";

// const baseWeatherUrl = 'https://api.openweathermap.org/data/3.0/onecall';

const getAttendance = async ({ eventId, accepted = false }) => {
    const queries = [Query.equal("gameId", eventId)];

    if (accepted) {
        queries.push(Query.equal("status", "accepted"));
    }

    const { documents: attendance } = await listDocuments("attendance", queries);
    return attendance;
};

const getWeatherData = (parkId, game) => {
    const { gameDate } = game;
    const apiKey = import.meta.env.VITE_GOOGLE_SERVICES_API_KEY;
    const baseUrl = "https://weather.googleapis.com/v1";

    const now = new Date();
    const gameTime = new Date(gameDate);
    const sixHoursBefore = new Date(gameTime.getTime() - 6 * 60 * 60 * 1000);

    // Don't fetch weather for games more than 5 days in the future or more than 1 day in the past
    const diffTime = gameTime - now;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 5 || diffDays < -1) {
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
                        allForecastHours = allForecastHours.concat(data.forecastHours);
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
        const url = `${baseUrl}/history/hours:lookup?key=${apiKey}&location.latitude=${park.latitude}&location.longitude=${park.longitude}&hours=6&unitsSystem=IMPERIAL`;
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
        const park = await readDocument("parks", parkId);
        if (!park) return null;

        let hourlyData = [];

        if (sixHoursBefore > now) {
            // All in the future
            hourlyData = await getForecast(park);
        } else if (gameTime < now) {
            // All in the past
            hourlyData = await getHistory(park);
        } else {
            // Hybrid
            const forecastData = await getForecast(park);
            const historyData = await getHistory(park);
            hourlyData = [...historyData, ...forecastData];
        }

        // Filter to the 6 hours before the game
        const sixHoursBeforeTimestamp = sixHoursBefore.getTime();
        const gameTimeTimestamp = gameTime.getTime();
        const filteredData = hourlyData.filter((hour) => {
            const hourTimestamp = new Date(hour.interval.startTime).getTime();
            return hourTimestamp >= sixHoursBeforeTimestamp && hourTimestamp <= gameTimeTimestamp;
        });

        return { hourly: filteredData };
    })();
};

export async function getEventById({ request, eventId }) {
    const { seasons: season, playerChart, ...game } = await readDocument("games", eventId);
    const { teams = [], parkId } = season;

    const { documents: userIds } = await listDocuments("memberships", [Query.equal("teamId", [teams[0].$id])]);

    const managerIds = userIds
        .filter(({ role }) => role === 'manager')
        .map(({ userId }) => userId);
    console.log({ userIds });

    // --- Start of deferred data ---
    const playerPromises = userIds.map(async ({ userId }) => {
        const result = await listDocuments("users", [Query.equal("$id", userId)]);
        return result.documents;
    });
    const playersPromise = Promise.all(playerPromises).then((users) => users.flat());

    const parkPromise = parkId ? readDocument("parks", parkId) : Promise.resolve(null);
    const attendancePromise = listDocuments("attendance", [Query.equal("gameId", eventId)]);

    const deferredData = Promise.all([playersPromise, parkPromise, attendancePromise]).then(
        ([players, park, attendance]) => ({
            players,
            park,
            attendance,
        })
    );

    return {
        deferredData,
        game: {
            ...game,
            // NOTE: We need to parse the string from the database twice before passing to the front end
            playerChart: JSON.parse(JSON.parse(playerChart)),
        },
        managerIds,
        season,
        teams,
        // Deferred data for weather, but is conditional so we didn't add it to the deferredData
        weatherPromise: getWeatherData(parkId, game),
    };
}

export async function getEventWithPlayerCharts({ request, eventId }) {
    const { seasons: season, playerChart, ...game } = await readDocument("games", eventId);
    const { teams = [] } = season;

    const { documents: userIds } = await listDocuments("memberships", [Query.equal("teamId", [teams[0].$id])]);

<<<<<<< HEAD
    const { userId: managerId } = userIds.find((userId) => userId.role === "manager");
=======
    const managerIds = userIds
        .filter(({ role }) => role === 'manager')
        .map(({ userId }) => userId);
>>>>>>> master

    // --- Start of deferred data ---
    const playerPromises = userIds.map(async ({ userId }) => {
        const result = await listDocuments("users", [Query.equal("$id", userId)]);
        return result.documents;
    });
    const players = await Promise.all(playerPromises).then((users) => users.flat());

    const attendance = await getAttendance({ eventId, accepted: false });

    return {
        attendance,
        game,
        managerIds,
        teams,
        // NOTE: We need to parse the string from the database twice before passing to the front end
        playerChart: playerChart ? JSON.parse(JSON.parse(playerChart)) : null,
        players,
    };
}
