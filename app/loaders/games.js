import { Query } from "node-appwrite";
import { listDocuments, readDocument } from "@/utils/databases";
import {
    parsePlayerChart,
    getUniquePlayerIdsFromChart,
} from "@/routes/gameday/utils/gamedayUtils";
import { createAdminClient } from "@/utils/appwrite/server";
import { DateTime } from "luxon";

const getAttendance = async ({ eventId, accepted = false, client }) => {
    const queries = [Query.equal("gameId", eventId)];

    if (accepted) {
        queries.push(Query.equal("status", "accepted"));
    }

    const { rows: attendance } = await listDocuments(
        "attendance",
        queries,
        client,
    );
    return attendance;
};

const getWeatherData = (parkId, game, client) => {
    const { gameDate } = game;
    const apiKey = import.meta.env.VITE_GOOGLE_SERVICES_API_KEY;
    const baseUrl = "https://weather.googleapis.com/v1";

    // Use Luxon for timezone/DST-safe arithmetic. gameDate is stored as an
    // ISO UTC instant in the database; convert to UTC DateTime for math.
    const now = DateTime.utc();
    const gameTime = DateTime.fromISO(gameDate, { zone: "utc" });
    const sixHoursBefore = gameTime.minus({ hours: 6 });

    // Don't fetch weather for games more than 5 days in the future or more than 1 day in the past
    const diffTime = gameTime.toMillis() - now.toMillis();
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
        const park = await readDocument("parks", parkId, [], client);
        if (!park) return null;

        let hourlyData = [];

        if (sixHoursBefore.toMillis() > now.toMillis()) {
            // All in the future
            hourlyData = await getForecast(park);
        } else if (gameTime.toMillis() < now.toMillis()) {
            // All in the past
            hourlyData = await getHistory(park);
        } else {
            // Hybrid
            const forecastData = await getForecast(park);
            const historyData = await getHistory(park);
            hourlyData = [...historyData, ...forecastData];
        }

        // Filter to the 6 hours before the game. Use Luxon to parse incoming
        // interval timestamps and compare as milliseconds since epoch.
        const sixHoursBeforeTimestamp = sixHoursBefore.toMillis();
        const gameTimeTimestamp = gameTime.toMillis();
        const filteredData = hourlyData.filter((hour) => {
            const hourTimestamp = DateTime.fromISO(hour.interval.startTime, {
                zone: "utc",
            }).toMillis();
            return (
                hourTimestamp >= sixHoursBeforeTimestamp &&
                hourTimestamp <= gameTimeTimestamp
            );
        });

        return { hourly: filteredData };
    })();
};

async function loadGameBase({ eventId, client }) {
    try {
        // Read basic game document
        const gameDoc = await readDocument("games", eventId, [], client);
        const {
            seasons: seasonId,
            playerChart: rawPlayerChart,
            ...game
        } = gameDoc;

        // Shared defensive parsing for consistent data structure across loaders
        const playerChart = parsePlayerChart(rawPlayerChart);

        // Manually fetch the season since TablesDB doesn't auto-populate relationships
        const season = seasonId
            ? await readDocument("seasons", seasonId, [], client)
            : null;

        if (!season) {
            console.warn(`No season found for game ${eventId}`);
            return null;
        }

        const { teams: teamIds = [] } = season;

        // Check if game has a specific location override, otherwise fall back to season location
        const parkId = game.parkId || season.parkId;
        const location = game.location || season.location;

        // Fetch actual team objects (TablesDB only stores IDs in relationships)
        let teams = [];
        if (teamIds.length > 0) {
            const teamsResponse = await listDocuments(
                "teams",
                [Query.equal("$id", teamIds)],
                client,
            );
            teams = teamsResponse.rows || [];
        } else if (season.teamId) {
            // Fallback to single teamId if teams array is empty
            const teamsResponse = await listDocuments(
                "teams",
                [Query.equal("$id", [season.teamId])],
                client,
            );
            teams = teamsResponse.rows || [];
        }

        if (teams.length === 0) {
            console.warn(`No teams found for season ${seasonId}`);
            return null;
        }

        // Load memberships for the primary team using Appwrite Teams API
        const { teams: teamsApi } = createAdminClient();
        const teamId = teams[0].$id;

        let userIds = [];
        let managerIds = [];
        let scorekeeperIds = [];

        try {
            const memberships = await teamsApi.listMemberships(teamId);

            userIds = memberships.memberships.map((m) => {
                let role = "player";
                if (m.roles.includes("owner") || m.roles.includes("manager")) {
                    role = "manager";
                } else if (m.roles.includes("scorekeeper")) {
                    role = "scorekeeper";
                }
                return {
                    userId: m.userId,
                    role,
                };
            });

            managerIds = memberships.memberships
                .filter(
                    (m) =>
                        m.roles.includes("manager") ||
                        m.roles.includes("owner"),
                )
                .map((m) => m.userId);

            scorekeeperIds = memberships.memberships
                .filter(
                    (m) =>
                        m.roles.includes("scorekeeper") ||
                        m.roles.includes("manager") ||
                        m.roles.includes("owner"),
                )
                .map((m) => m.userId);
        } catch (teamsApiError) {
            console.error("Error fetching team memberships:", teamsApiError);
        }

        return {
            game: { ...game, playerChart },
            season,
            teams,
            parkId,
            location,
            userIds,
            managerIds,
            scorekeeperIds,
            playerChart,
        };
    } catch (error) {
        // Game not found - return null to indicate deletion
        if (
            error.code === 404 ||
            error.message?.includes("could not be found")
        ) {
            return null;
        }
        // Re-throw other errors
        throw error;
    }
}

function makeDeferredData({ eventId, userIds, parkId, options = {}, client }) {
    const {
        includePlayers = true,
        includePark = true,
        includeAttendance = true,
        includeAwards = true,
        includeVotes = true,
        includeLogs = true,
    } = options;

    // Batch fetch all users in a single query instead of individual queries
    const userIdList = userIds.map(({ userId }) => userId);
    const playersPromise =
        includePlayers && userIdList.length > 0
            ? resolvePlayers(userIds, client)
            : Promise.resolve([]);

    const parkPromise =
        includePark && parkId
            ? readDocument("parks", parkId, [], client)
            : Promise.resolve(null);

    const attendancePromise = includeAttendance
        ? listDocuments("attendance", [Query.equal("gameId", eventId)], client)
        : Promise.resolve({ rows: [], total: 0 });

    const awardsPromise = includeAwards
        ? listDocuments("awards", [Query.equal("game_id", eventId)], client)
        : Promise.resolve({ rows: [], total: 0 });

    const votesPromise = includeVotes
        ? listDocuments("votes", [Query.equal("game_id", eventId)], client)
        : Promise.resolve({ rows: [], total: 0 });

    const logsPromise = includeLogs
        ? listDocuments(
              "game_logs",
              [
                  Query.equal("gameId", eventId),
                  Query.orderAsc("$createdAt"),
                  Query.limit(150), // Increase limit to handle games with many plays
              ],
              client,
          ).then((result) => result.rows || [])
        : Promise.resolve([]);

    return {
        players: playersPromise,
        park: parkPromise,
        attendance: attendancePromise,
        awards: awardsPromise,
        votes: votesPromise,
        logs: logsPromise,
    };
}

async function resolvePlayers(userIds, client) {
    // Batch fetch all users in a single query instead of individual queries
    const userIdList = userIds.map(({ userId }) => userId);
    if (userIdList.length === 0) {
        return [];
    }

    // 1. Fetch documents from the 'users' database collection
    const result = await listDocuments(
        "users",
        [Query.equal("$id", userIdList)],
        client,
    );
    const players = result.rows || [];

    // 2. Fetch associated account information (specifically preferences) from the Users management API
    // This requires an admin client to read preferences of other users.
    try {
        const { users: adminUsers } = createAdminClient();
        const accountResult = await adminUsers.list([
            Query.equal("$id", userIdList),
        ]);
        const accounts = accountResult.users || [];

        // 3. Create a map of account preferences for O(1) lookup
        const accountMap = new Map(accounts.map((a) => [a.$id, a]));

        // 4. Merge account preferences (like avatarUrl) into the database documents
        return players.map((p) => {
            const acc = accountMap.get(p.$id);
            // Account preferences take precedence for display data like avatars
            return {
                ...p,
                avatarUrl: acc?.prefs?.avatarUrl || p.avatarUrl,
            };
        });
    } catch (e) {
        console.warn(
            "resolvePlayers: Failed to fetch account preferences for enrichment. Falling back to database collection data.",
            e.message,
        );
        return players;
    }
}

export async function getEventById({ eventId, client, ...options }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    // Extract weather option and pass the rest to deferred data
    const { includeWeather = true, ...deferredOptions } = options;

    // Use shared loader helper to get base data for the event
    const baseData = await loadGameBase({ eventId, client: client });

    // Game was deleted
    if (!baseData) {
        return {
            gameDeleted: true,
            game: null,
            deferredData: null,
            managerIds: [],
            scorekeeperIds: [],
            season: null,
            teams: [],
            weatherPromise: Promise.resolve(null),
        };
    }

    const {
        game,
        season,
        teams,
        parkId,
        location,
        userIds,
        managerIds,
        scorekeeperIds,
        playerChart,
    } = baseData;

    // Fetch weather data as a deferred promise if a park is available
    const weatherPromise =
        includeWeather && parkId
            ? getWeatherData(parkId, game, client)
            : Promise.resolve(null);

    // Batch fetch remaining event data as deferred promises
    const deferredData = makeDeferredData({
        eventId,
        userIds,
        parkId,
        options: deferredOptions,
        client,
    });

    return {
        gameDeleted: false,
        game: { ...game, location, playerChart },
        ...deferredData,
        userIds,
        managerIds,
        scorekeeperIds,
        season,
        teams,
        weatherPromise,
    };
}

export async function getEventWithPlayerCharts({ client, eventId }) {
    if (!client) {
        throw new Error(
            "A constructed 'client' object is strictly required for authorization.",
        );
    }

    // Use shared loader helper to get base data for the event
    const baseData = await loadGameBase({ eventId, client: client });

    if (!baseData) {
        throw new Error(`Game ${eventId} could not be found.`);
    }

    const { game, teams, userIds, managerIds, scorekeeperIds, playerChart } =
        baseData;

    // Use shared defensive parser (guaranteed to be parsed or null from loadGameBase)
    const parsedChart = playerChart ?? null;

    // Identify guest players already in the chart
    const chartPlayerIds = getUniquePlayerIdsFromChart(parsedChart);
    const officialUserIds = new Set(userIds.map((u) => u.userId));

    // Fetch guest players for THIS specific event on THIS team
    const teamId = teams[0]?.$id;
    const guestQueries = [Query.equal("isTemporary", true)];
    if (teamId) {
        guestQueries.push(Query.equal("teamId", teamId));
    }
    guestQueries.push(Query.equal("createdForEvent", eventId));

    const { rows: teamGuestPlayers } = await listDocuments(
        "users",
        guestQueries,
        client,
    );

    // Identify guest players in the chart that were not fetched by team/event lookup
    const fetchedGuestIds = new Set(teamGuestPlayers.map((p) => p.$id));
    const extraChartGuestIds = Array.from(chartPlayerIds).filter(
        (id) => !officialUserIds.has(id) && !fetchedGuestIds.has(id),
    );

    let extraChartGuests = [];
    if (extraChartGuestIds.length > 0) {
        const { rows: extraRows } = await listDocuments(
            "users",
            [Query.equal("$id", extraChartGuestIds)],
            client,
        );
        extraChartGuests = extraRows;
    }

    // Combine all guest players
    const allGuestPlayers = [...teamGuestPlayers, ...extraChartGuests];

    // Parallelize official players + attendance
    // Only resolve official team users (don't pass guest IDs to resolvePlayers as they won't exist in users collection)
    const filteredOfficialUserIds = userIds.filter(
        (u) => !allGuestPlayers.some((g) => g.$id === u.userId),
    );

    const [officialPlayers, attendance] = await Promise.all([
        resolvePlayers(filteredOfficialUserIds, client),
        getAttendance({ eventId, accepted: false, client: client }),
    ]);

    // Combine for the final players list
    // Ensure guest players are marked as "accepted" so they show up
    // Filter to ensure unique player IDs (prevents duplicate key warnings)
    const players = [
        ...officialPlayers,
        ...allGuestPlayers.map((p) => ({
            ...p,
            availability: "accepted",
        })),
    ].filter(
        (p, index, self) => index === self.findIndex((t) => t.$id === p.$id),
    );

    // Add guests to userIds array with regular 'player' role
    const extendedUserIds = [
        ...userIds,
        ...allGuestPlayers.map((g) => ({ userId: g.$id, role: "player" })),
    ];

    return {
        attendance,
        game,
        userIds: extendedUserIds,
        managerIds,
        scorekeeperIds,
        teams,
        playerChart: parsedChart,
        players,
    };
}
