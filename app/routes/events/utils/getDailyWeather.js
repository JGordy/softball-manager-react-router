function getTimeOfDayKey(gameDate) {
    const gameHour = new Date(gameDate).getHours();

    if (gameHour < 5) {
        return "night";
    } else if (gameHour < 12) {
        return "morn";
    } else if (gameHour < 17) {
        return "day";
    } else if (gameHour < 21) {
        return "eve";
    } else {
        return "night";
    }
}

export default function getDailyWeather(weather, gameDate) {
    if (!weather) return null;

    const gameDateObj = new Date(gameDate);
    const gameDayString = gameDateObj.toISOString().split('T')[0];

    const dailyWeather = weather.find(dailyWeather => {
        const weatherDate = new Date(dailyWeather.dt * 1000);
        const weatherDayString = weatherDate.toISOString().split('T')[0];
        return gameDayString === weatherDayString;
    });

    if (!dailyWeather) return null;

    const timeOfDay = getTimeOfDayKey(gameDate);

    return {
        ...dailyWeather,
        timeOfDay,
    }
};