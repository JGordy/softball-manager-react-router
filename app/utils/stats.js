import {
    HITS,
    WALKS,
    OUTS,
    EVENT_TYPE_MAP,
} from "@/routes/events/components/scoring/scoringConstants";

/**
 * Calculate standard softball statistics for a set of game logs.
 *
 * @param {Array} logs - Array of game log objects
 * @param {Array} playerChart - Array of player objects (the lineup)
 * @returns {Array} Array of player stats objects
 */
export const calculateGameStats = (logs = [], playerChart = []) => {
    // 1. Initialize stats map for all players in lineup
    const statsMap = {};

    playerChart.forEach((player) => {
        statsMap[player.$id] = {
            player, // Keep reference to player info
            PA: 0, // Plate Appearances
            AB: 0, // At Bats
            H: 0, // Hits
            "1B": 0, // Singles
            "2B": 0, // Doubles
            "3B": 0, // Triples
            HR: 0, // Home Runs
            R: 0, // Runs Scored
            RBI: 0, // Runs Batted In
            BB: 0, // Walks
            K: 0, // Strikeouts
            AVG: ".000", // Batting Average
            OBP: ".000", // On-Base Percentage
            SLG: ".000", // Slugging Percentage
            OPS: ".000", // On-Base Plus Slugging
        };
    });

    // 2. Process logs
    logs.forEach((log) => {
        const batterId = log.playerId;
        if (!statsMap[batterId]) return; // Skip if player not in chart (shouldn't happen)

        const batterStats = statsMap[batterId];
        const eventType = log.eventType;

        // Ensure we are using standardized DB values
        let standardizedEvent = eventType;
        const isUIKey = Object.keys(EVENT_TYPE_MAP).includes(eventType);
        if (isUIKey) {
            standardizedEvent = EVENT_TYPE_MAP[eventType];
        }

        // Basic Counts for the BATTER
        batterStats.PA++;
        batterStats.RBI += parseInt(log.rbi || 0, 10);

        // Track Strikeouts (before standardization since K maps to 'out')
        if (eventType === "K") {
            batterStats.K++;
        }

        // Hit Detection
        if (HITS.includes(standardizedEvent)) {
            batterStats.AB++;
            batterStats.H++;
            if (standardizedEvent === "single") batterStats["1B"]++;
            if (standardizedEvent === "double") batterStats["2B"]++;
            if (standardizedEvent === "triple") batterStats["3B"]++;
            if (standardizedEvent === "homerun") batterStats.HR++;
        }
        // Walk Detection
        else if (WALKS.includes(standardizedEvent)) {
            batterStats.BB++;
            // Walks do not count as At Bats
        }
        // Out Detection
        else if (
            OUTS.includes(standardizedEvent) ||
            standardizedEvent === "fielders_choice" ||
            standardizedEvent === "error"
        ) {
            batterStats.AB++;
        }

        // Parse baseState to credit RUNS to players who scored
        let baseState = {};
        try {
            baseState =
                typeof log.baseState === "string"
                    ? JSON.parse(log.baseState)
                    : log.baseState || {};
        } catch (e) {
            console.warn("Stats: Failed to parse baseState", log);
        }

        // Credit runs to ANY player who scored on this play
        if (baseState.scored && Array.isArray(baseState.scored)) {
            baseState.scored.forEach((scoredPlayerId) => {
                if (statsMap[scoredPlayerId]) {
                    statsMap[scoredPlayerId].R++;
                }
            });
        }
    });

    // 3. Calculate Rates
    Object.values(statsMap).forEach((stat) => {
        // AVG = H / AB
        stat.AVG =
            stat.AB > 0
                ? (stat.H / stat.AB).toFixed(3).replace(/^0/, "")
                : ".000";

        // OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
        // Simplified: (H + BB) / (AB + BB) (ignoring Sac Flies/HBP for now as we don't track them)
        const obpNumerator = stat.H + stat.BB;
        const obpDenominator = stat.AB + stat.BB;
        stat.OBP =
            obpDenominator > 0
                ? (obpNumerator / obpDenominator).toFixed(3).replace(/^0/, "")
                : ".000";

        // SLG = (1B + 2*2B + 3*3B + 4*HR) / AB
        const totalBases =
            stat["1B"] + 2 * stat["2B"] + 3 * stat["3B"] + 4 * stat.HR;
        stat.SLG =
            stat.AB > 0
                ? (totalBases / stat.AB).toFixed(3).replace(/^0/, "")
                : ".000";

        // OPS = OBP + SLG
        // Note: We need floating point values for accurate addition, then format
        const obpVal = parseFloat(stat.OBP || 0);
        const slgVal = parseFloat(stat.SLG || 0);
        stat.OPS = (obpVal + slgVal).toFixed(3).replace(/^0/, "");
    });

    // Return as array suitable for Table rows
    return Object.values(statsMap);
};

export const calculateTeamTotals = (statsArray) => {
    const totals = {
        player: { firstName: "TEAM", lastName: "TOTALS", $id: "totals" },
        AB: 0,
        H: 0,
        R: 0,
        RBI: 0,
        BB: 0,
        K: 0,
        "1B": 0,
        "2B": 0,
        "3B": 0,
        HR: 0,
        PA: 0,
    };

    statsArray.forEach((stat) => {
        totals.AB += stat.AB;
        totals.H += stat.H;
        totals.R += stat.R;
        totals.RBI += stat.RBI;
        totals.BB += stat.BB;
        totals.K += stat.K;
        totals["1B"] += stat["1B"];
        totals["2B"] += stat["2B"];
        totals["3B"] += stat["3B"];
        totals.HR += stat.HR;
        totals.PA += stat.PA;
    });

    // Calculate Team Rates
    totals.AVG =
        totals.AB > 0
            ? (totals.H / totals.AB).toFixed(3).replace(/^0/, "")
            : ".000";

    const obpNumerator = totals.H + totals.BB;
    const obpDenominator = totals.AB + totals.BB;
    totals.OBP =
        obpDenominator > 0
            ? (obpNumerator / obpDenominator).toFixed(3).replace(/^0/, "")
            : ".000";

    const totalBases =
        totals["1B"] + 2 * totals["2B"] + 3 * totals["3B"] + 4 * totals.HR;
    totals.SLG =
        totals.AB > 0
            ? (totalBases / totals.AB).toFixed(3).replace(/^0/, "")
            : ".000";

    const obpVal = parseFloat(totals.OBP || 0);
    const slgVal = parseFloat(totals.SLG || 0);
    totals.OPS = (obpVal + slgVal).toFixed(3).replace(/^0/, "");

    return totals;
};
