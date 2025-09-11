const isSeasonCurrent = (season, now) => {
    if (!season || !season.startDate) return false;
    const start = new Date(season.startDate);
    const end = season.endDate ? new Date(season.endDate) : null;

    return start <= now && (!end || end >= now);
};

const getUpcomingSeasonStartDate = (seasons, now) => {
    if (!seasons || seasons.length === 0) return null;
    let earliestFutureDate = null;
    seasons.forEach((season) => {
        if (season.startDate) {
            const start = new Date(season.startDate);
            if (start > now) {
                // Season starts in the future
                if (!earliestFutureDate || start < earliestFutureDate) {
                    earliestFutureDate = start;
                }
            }
        }
    });
    return earliestFutureDate;
};

const getMostRecentPastSeasonEndDate = (seasons, now) => {
    if (!seasons || seasons.length === 0) return null;
    let latestPastDate = null;
    seasons.forEach((season) => {
        if (season.endDate) {
            const end = new Date(season.endDate);
            if (end < now) {
                // Season ended in the past
                if (!latestPastDate || end > latestPastDate) {
                    latestPastDate = end;
                }
            }
        }
    });
    return latestPastDate;
};

const sortTeams = (teamA, teamB) => {
    const now = new Date();

    const seasonsA = teamA.seasons || [];
    const seasonsB = teamB.seasons || [];

    // 1. Currently in progress
    const isTeamACurrent = seasonsA.some(isSeasonCurrent, now);
    const isTeamBCurrent = seasonsB.some(isSeasonCurrent, now);
    if (isTeamACurrent && !isTeamBCurrent) return -1;
    if (!isTeamACurrent && isTeamBCurrent) return 1;

    // 2. Next upcoming season
    const upcomingA = getUpcomingSeasonStartDate(seasonsA, now);
    const upcomingB = getUpcomingSeasonStartDate(seasonsB, now);
    if (upcomingA && !upcomingB) return -1;
    if (!upcomingA && upcomingB) return 1;
    if (upcomingA && upcomingB) return upcomingA.getTime() - upcomingB.getTime(); // Earliest upcoming first

    // 3. Most recent season played
    const recentPastA = getMostRecentPastSeasonEndDate(seasonsA);
    const recentPastB = getMostRecentPastSeasonEndDate(seasonsB);
    if (recentPastA && !recentPastB) return -1;
    if (!recentPastA && recentPastB) return 1;
    if (recentPastA && recentPastB) return recentPastB.getTime() - recentPastA.getTime(); // Most recent past first (descending)

    // 4. Remaining teams (no current, no upcoming, no past seasons) or tie-breaker
    return teamA.name.localeCompare(teamB.name);
};

export default sortTeams;
