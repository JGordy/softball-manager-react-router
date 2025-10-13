import { DateTime } from "luxon";

const isSeasonCurrent = (season, now) => {
    if (!season || !season.startDate) return false;
    const start = DateTime.fromISO(season.startDate, { zone: "utc" });
    const end = season.endDate
        ? DateTime.fromISO(season.endDate, { zone: "utc" })
        : null;

    return (
        start.toMillis() <= now.toMillis() &&
        (!end || end.toMillis() >= now.toMillis())
    );
};

const getUpcomingSeasonStartDate = (seasons, now = DateTime.utc()) => {
    if (!seasons || seasons.length === 0) return null;
    let earliestFutureDate = null;
    seasons.forEach((season) => {
        if (season.startDate) {
            const start = DateTime.fromISO(season.startDate, { zone: "utc" });
            if (start.toMillis() > now.toMillis()) {
                // Season starts in the future
                if (
                    !earliestFutureDate ||
                    start.toMillis() < earliestFutureDate.toMillis()
                ) {
                    earliestFutureDate = start;
                }
            }
        }
    });
    return earliestFutureDate;
};

const getMostRecentPastSeasonEndDate = (seasons, now = DateTime.utc()) => {
    if (!seasons || seasons.length === 0) return null;
    let latestPastDate = null;
    seasons.forEach((season) => {
        if (season.endDate) {
            const end = DateTime.fromISO(season.endDate, { zone: "utc" });
            if (end.toMillis() < now.toMillis()) {
                // Season ended in the past
                if (
                    !latestPastDate ||
                    end.toMillis() > latestPastDate.toMillis()
                ) {
                    latestPastDate = end;
                }
            }
        }
    });
    return latestPastDate;
};

const sortTeams = (teamA, teamB) => {
    const now = DateTime.utc();

    const seasonsA = teamA.seasons || [];
    const seasonsB = teamB.seasons || [];

    // 1. Currently in progress
    const isTeamACurrent = seasonsA.some((s) => isSeasonCurrent(s, now));
    const isTeamBCurrent = seasonsB.some((s) => isSeasonCurrent(s, now));
    if (isTeamACurrent && !isTeamBCurrent) return -1;
    if (!isTeamACurrent && isTeamBCurrent) return 1;

    // 2. Next upcoming season
    const upcomingA = getUpcomingSeasonStartDate(seasonsA, now);
    const upcomingB = getUpcomingSeasonStartDate(seasonsB, now);
    if (upcomingA && !upcomingB) return -1;
    if (!upcomingA && upcomingB) return 1;
    if (upcomingA && upcomingB)
        return upcomingA.toMillis() - upcomingB.toMillis(); // Earliest upcoming first

    // 3. Most recent season played
    const recentPastA = getMostRecentPastSeasonEndDate(seasonsA);
    const recentPastB = getMostRecentPastSeasonEndDate(seasonsB);
    if (recentPastA && !recentPastB) return -1;
    if (!recentPastA && recentPastB) return 1;
    if (recentPastA && recentPastB)
        return recentPastB.toMillis() - recentPastA.toMillis(); // Most recent past first (descending)

    // 4. Remaining teams (no current, no upcoming, no past seasons) or tie-breaker
    return teamA.name.localeCompare(teamB.name);
};

export default sortTeams;
