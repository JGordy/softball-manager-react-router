import {
    HITS,
    WALKS,
    OUTS,
    EVENT_TYPE_MAP,
} from "@/routes/events/constants/scoringConstants";

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
            SF: 0, // Sacrifice Flies
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
        // Sac Fly Detection
        else if (standardizedEvent === "sacrifice_fly") {
            batterStats.SF++;
            // Sac flies do not count as At Bats
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
        // Simplified: (H + BB) / (AB + BB + SF) (ignoring HBP for now as we don't track them)
        const obpNumerator = stat.H + stat.BB;
        const obpDenominator = stat.AB + stat.BB + stat.SF;
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
        SF: 0,
        PA: 0,
    };

    statsArray.forEach((stat) => {
        totals.AB += stat.AB || 0;
        totals.H += stat.H || 0;
        totals.R += stat.R || 0;
        totals.RBI += stat.RBI || 0;
        totals.BB += stat.BB || 0;
        totals.K += stat.K || 0;
        totals.SF += stat.SF || 0;
        totals["1B"] += stat["1B"] || 0;
        totals["2B"] += stat["2B"] || 0;
        totals["3B"] += stat["3B"] || 0;
        totals.HR += stat.HR || 0;
        totals.PA += stat.PA || 0;
    });

    // Calculate Team Rates
    totals.AVG =
        totals.AB > 0
            ? (totals.H / totals.AB).toFixed(3).replace(/^0/, "")
            : ".000";

    const obpNumerator = totals.H + totals.BB;
    const obpDenominator = totals.AB + totals.BB + totals.SF;
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

/**
 * Calculate statistics for a single player based on a set of game logs.
 * Returns an object with detailed counts and calculated rates.
 *
 * @param {Array} logs - Array of game log objects for a single player
 * @returns {Object} Stats object
 */
export const calculatePlayerStats = (logs) => {
    let hits = 0;
    let ab = 0; // At Bats
    let rbi = 0;
    let doubles = 0;
    let triples = 0;
    let homeruns = 0;

    // Detailed counts
    const details = {
        "1B": 0,
        "2B": 0,
        "3B": 0,
        HR: 0,
        BB: 0,
        K: 0,
        RBI: 0,
        Outs: 0,
        E: 0,
        FC: 0,
        SF: 0,
    };

    logs.forEach((log) => {
        const eventType = log.eventType;
        const logRbi = log.rbi || 0;

        rbi += logRbi;
        details.RBI += logRbi;

        // Standardize event type
        let type = eventType;
        const isUIKey = Object.keys(EVENT_TYPE_MAP).includes(eventType);
        if (isUIKey) {
            type = EVENT_TYPE_MAP[eventType];
        }

        switch (type) {
            case "single":
                hits++;
                ab++;
                details["1B"]++;
                break;
            case "double":
                hits++;
                ab++;
                doubles++;
                details["2B"]++;
                break;
            case "triple":
                hits++;
                ab++;
                triples++;
                details["3B"]++;
                break;
            case "homerun":
                hits++;
                ab++;
                homeruns++;
                details.HR++;
                break;
            case "walk":
                details.BB++;
                break;
            case "out":
                ab++;
                details.Outs++;
                // Track strikeout specifically if event was 'K'
                if (eventType === "K") {
                    details.K++;
                }
                break;
            case "error":
                ab++;
                details.E++;
                break;
            case "fielders_choice":
                ab++;
                details.FC++;
                break;
            case "sacrifice_fly":
                details.SF++;
                break;
            default:
                break;
        }
    });

    // Calculated Stats
    const obpDenominator = ab + details.BB + details.SF;
    const avg = ab > 0 ? (hits / ab).toFixed(3) : ".000";

    const obp =
        obpDenominator > 0
            ? ((hits + details.BB) / obpDenominator).toFixed(3)
            : ".000";

    const totalBases =
        details["1B"] + 2 * details["2B"] + 3 * details["3B"] + 4 * details.HR;
    const slg = ab > 0 ? (totalBases / ab).toFixed(3) : ".000";

    const opsVal = parseFloat(obp) + parseFloat(slg);
    const ops = opsVal.toFixed(3);

    return {
        hits,
        ab,
        rbi,
        doubles,
        triples,
        homeruns,
        details,
        calculated: {
            avg: avg.replace(/^0+/, ""),
            obp: obp.replace(/^0+/, ""),
            slg: slg.replace(/^0+/, ""),
            ops: ops.replace(/^0+/, ""),
        },
    };
};
