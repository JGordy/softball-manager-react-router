import { Query } from '@/appwrite';
import { listDocuments, readDocument } from '@/utils/databases';

const baseWeatherUrl = 'https://api.openweathermap.org/data/3.0/onecall';

const getAttendance = async ({ eventId, accepted = false }) => {
    const { documents: attendance } = await listDocuments('attendance', [
        Query.equal('gameId', eventId),
        ...[accepted && Query.equal('status', 'accepted')],
    ]);
    return attendance;
};

const getWeatherData = (parkId, game) => {
    const { gameDate } = game;
    const today = new Date();
    const gameDay = new Date(gameDate);

    if (gameDay < today || !parkId) {
        return Promise.resolve(null);
    }

    const diffTime = gameDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffDays > 8) {
        return Promise.resolve(null);
    }

    return (async () => {
        const park = await readDocument('parks', parkId);
        const exclude = ['minutely'];

        if (diffHours <= 48) {
            exclude.push('daily');
        } else {
            exclude.push('hourly');
        }

        const url = `${baseWeatherUrl}?lat=${park.latitude}&lon=${park.longitude}&exclude=${exclude.join(',')}&appid=${import.meta.env.VITE_OPEN_WEATHER_MAP_KEY}`;

        try {
            const response = await fetch(url);
            if (response.ok) {
                return response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    })();
};

export async function getEventById({ request, eventId }) {
    const { seasons: season, playerChart, ...game } = await readDocument('games', eventId);
    const { teams = [], parkId } = season;

    const { documents: userIds } = await listDocuments('memberships', [
        Query.equal('teamId', [teams[0].$id]),
    ]);

    const { userId: managerId } = userIds.find(userId => userId.role === 'manager');

    // --- Start of deferred data ---
    const playerPromises = userIds.map(async ({ userId }) => {
        const result = await listDocuments('users', [
            Query.equal('$id', userId),
        ]);
        return result.documents;
    });
    const playersPromise = Promise.all(playerPromises).then(users => users.flat());

    const parkPromise = parkId ? readDocument('parks', parkId) : Promise.resolve(null);
    const attendancePromise = listDocuments('attendance', [Query.equal('gameId', eventId)]);

    const deferredData = Promise.all([
        playersPromise,
        parkPromise,
        attendancePromise,
    ]).then(([players, park, attendance]) => ({
        players,
        park,
        attendance,
    }));

    return {
        deferredData,
        game: {
            ...game,
            // NOTE: We need to parse the string from the database twice before passing to the front end
            playerChart: JSON.parse(JSON.parse(playerChart)),
        },
        managerId,
        season,
        teams,
        // Deferred data for weather, but is conditional so we didn't add it to the deferredData
        weatherPromise: getWeatherData(parkId, game),
    };
}

export async function getEventWithPlayerCharts({ request, eventId }) {
    const { seasons: season, playerChart, ...game } = await readDocument('games', eventId);
    const { teams = [] } = season;

    const { documents: userIds } = await listDocuments('memberships', [
        Query.equal('teamId', [teams[0].$id]),
    ]);

    const { userId: managerId } = userIds.find(userId => userId.role === 'manager');

    // --- Start of deferred data ---
    const playerPromises = userIds.map(async ({ userId }) => {
        const result = await listDocuments('users', [
            Query.equal('$id', userId),
        ]);
        return result.documents;
    });
    const players = await Promise.all(playerPromises).then(users => users.flat());

    const attendance = await getAttendance({ eventId, accepted: true });

    return {
        attendance,
        game,
        managerId,
        teams,
        // NOTE: We need to parse the string from the database twice before passing to the front end
        playerChart: playerChart ? JSON.parse(JSON.parse(playerChart)) : null,
        players,
    };
}