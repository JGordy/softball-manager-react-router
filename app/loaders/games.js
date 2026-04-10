import { Query } from "node-appwrite";
import { DateTime } from "luxon";

import { listDocuments, readDocument } from "@/utils/databases";
import { parsePlayerChart } from "@/routes/gameday/utils/gamedayUtils";
import { createAdminClient } from "@/utils/appwrite/server";
import { joinAchievements } from "@/utils/achievements";

/**
 * Enriches a parsed player chart with jersey numbers from team preferences.
 * Handles both starters and their direct substitutions.
 */
function enrichPlayerChartWithJerseyNumbers(parsedChart, teamPrefs) {
    if (!parsedChart) return null;
    return parsedChart.map((slot) => {
        const jersey = teamPrefs?.jerseyNumbers?.[slot.$id] || null;
        const enrichedSubstitutions = (slot.substitutions || []).map((sub) => ({
            ...sub,
            jerseyNumber: teamPrefs?.jerseyNumbers?.[sub.playerId] || null,
        }));
        return {
            ...slot,
            jerseyNumber: jersey,
            substitutions: enrichedSubstitutions,
        };
    });
}

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
        const { seasons: seasonId, playerChart, ...game } = gameDoc;

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

        // Fetch team preferences for jersey numbers once at the base level
        let teamPrefs = {};
        try {
            teamPrefs = await teamsApi.getPrefs(teamId);
        } catch (prefsError) {
            console.warn(
                `loadGameBase: Failed to fetch team prefs for team ${teamId}:`,
                prefsError.message,
            );
        }

        return {
            game,
            season,
            teams,
            parkId,
            location,
            userIds,
            managerIds,
            scorekeeperIds,
            playerChart,
            teamPrefs,
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
        includeAchievements = true,
    } = options;

    // Batch fetch all users in a single query instead of individual queries
    const playersPromise = includePlayers
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

    const achievementsPromise = includeAchievements
        ? listDocuments(
              "user_achievements",
              [Query.equal("gameId", eventId), Query.limit(100)],
              client,
          ).then(
              async (result) =>
                  await joinAchievements(result.rows || [], client),
          )
        : Promise.resolve([]);

    return {
        players: playersPromise,
        park: parkPromise,
        attendance: attendancePromise,
        awards: awardsPromise,
        votes: votesPromise,
        logs: logsPromise,
        achievements: achievementsPromise,
    };
}

async function resolvePlayers(userIds, client) {
    // 1. Fetch documents from the 'users' database collection
    // Defensive check: Appwrite $id query fails if an array contains an empty string
    const validUserIdList = userIds
        .map(({ userId }) => userId)
        .filter((id) => typeof id === "string" && id.trim() !== "");

    if (validUserIdList.length === 0) {
        return [];
    }

    const result = await listDocuments(
        "users",
        [Query.equal("$id", validUserIdList)],
        client,
    );
    const players = result.rows || [];

    // 2. Fetch associated account information (specifically preferences) from the Users management API
    // This requires an admin client to read preferences of other users.
    try {
        const { users: adminUsers } = createAdminClient();
        const accountResult = await adminUsers.list([
            Query.equal("$id", validUserIdList),
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
        teamPrefs,
    } = baseData;

    // Build deferred data object (promises for lazy loading in the UI)
    const deferredData = makeDeferredData({
        eventId,
        userIds,
        parkId,
        options: deferredOptions,
        client: client,
    });

    const parsedChart = parsePlayerChart(playerChart) ?? null;

    // Enrich playerChart with jersey numbers (using teamPrefs from loadGameBase)
    const enrichedChart = enrichPlayerChartWithJerseyNumbers(
        parsedChart,
        teamPrefs,
    );

    return {
        gameDeleted: false,
        deferredData,
        game: {
            ...game,
            playerChart: enrichedChart,
        },
        location,
        userIds,
        managerIds,
        scorekeeperIds,
        season,
        teams,
        // Deferred data for weather, but is conditional so we didn't add it to the deferredData
        weatherPromise: includeWeather
            ? getWeatherData(parkId, game, client)
            : Promise.resolve(null),
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

    const {
        game,
        teams,
        userIds,
        managerIds,
        scorekeeperIds,
        playerChart,
        teamPrefs,
    } = baseData;

    // Use shared defensive parser
    const parsedChart = parsePlayerChart(playerChart) ?? null;

    const extraPlayerIdSet = new Set();

    (parsedChart || []).forEach((slot) => {
        if (!slot || typeof slot !== "object") {
            return;
        }

        // Starter ID is stored on $id
        const starterId = slot.$id;
        if (
            typeof starterId === "string" &&
            starterId.trim() !== "" &&
            !userIds.some((u) => u.userId === starterId)
        ) {
            extraPlayerIdSet.add(starterId);
        }

        // Substitution IDs are stored on substitutions[].playerId
        if (Array.isArray(slot.substitutions)) {
            slot.substitutions.forEach((sub) => {
                if (!sub || typeof sub !== "object") {
                    return;
                }

                const subId = sub.playerId;
                if (
                    typeof subId === "string" &&
                    subId.trim() !== "" &&
                    !userIds.some((u) => u.userId === subId)
                ) {
                    extraPlayerIdSet.add(subId);
                }
            });
        }
    });

    const extraPlayerIds = Array.from(extraPlayerIdSet);

    const allUserIds = [...userIds];
    extraPlayerIds.forEach((id) => {
        if (!allUserIds.some((u) => u.userId === id)) {
            allUserIds.push({ userId: id, role: "player" });
        }
    });

    // Fully resolve the players for the non-deferred path
    const players = await resolvePlayers(allUserIds, client);

    // Enrich players with jersey numbers (using teamPrefs from loadGameBase)
    const enrichedPlayers = players.map((p) => ({
        ...p,
        jerseyNumber: teamPrefs?.jerseyNumbers?.[p.$id] || null,
    }));

    const attendance = await getAttendance({
        eventId,
        accepted: false,
        client: client,
    });

    // Enrich playerChart with jersey numbers
    const enrichedChart = enrichPlayerChartWithJerseyNumbers(
        parsedChart,
        teamPrefs,
    );

    return {
        attendance,
        game,
        userIds: allUserIds, // Return combined IDs
        managerIds,
        scorekeeperIds,
        teams,
        playerChart: enrichedChart,
        players: enrichedPlayers,
    };
}
