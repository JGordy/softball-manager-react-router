import { HITS, WALKS, OUTS, EVENT_TYPE_MAP } from "../constants/scoring.js";
import { isOpponentPlay } from "../routes/gameday/utils/gamedayUtils.js";

const formatStat = (val) => val.replace(/^0/, "");

/**
 * Calculate standard softball statistics for a set of game logs.
 *
 * @param {Array} logs - Array of game log objects
 * @param {Array} playerChart - Array of player objects (the lineup)
 * @returns {Array} Array of player stats objects
 */
export const calculateGameStats = (
    logs = [],
    playerChart = [],
    isOpponent = false,
    isHomeGame = undefined,
) => {
    // 1. Initialize stats map for all players in lineup
    const statsMap = {};

    const initStats = (player) => ({
        player,
        PA: 0,
        AB: 0,
        H: 0,
        "1B": 0,
        "2B": 0,
        "3B": 0,
        HR: 0,
        R: 0,
        RBI: 0,
        BB: 0,
        K: 0,
        SF: 0,
        AVG: ".000",
        OBP: ".000",
        SLG: ".000",
        OPS: ".000",
    });

    const ensureOpponentBatter = (batterId) => {
        if (
            isOpponent &&
            batterId &&
            !statsMap[batterId] &&
            batterId.startsWith("OPP_BAT_")
        ) {
            const match = batterId.match(/OPP_BAT_(\d+)/);
            const batterNum = match ? match[1] : batterId;
            statsMap[batterId] = initStats({
                $id: batterId,
                firstName: "Batter",
                lastName: batterNum,
                jerseyNumber: batterNum,
            });
            return true;
        }
        return false;
    };

    playerChart.forEach((slot) => {
        // Seed entry for the original slot player
        statsMap[slot.$id] = initStats(slot);

        // Seed entries for any substitutes in this slot
        slot.substitutions?.forEach((sub) => {
            if (!statsMap[sub.playerId]) {
                const subPlayer = {
                    $id: sub.playerId,
                    firstName: sub.firstName,
                    lastName: sub.lastName,
                    jerseyNumber: sub.jerseyNumber,
                };
                statsMap[sub.playerId] = initStats(subPlayer);
            }
        });
    });

    // 2. Process logs
    logs.forEach((log) => {
        // Skip substitution, lineup pointer, injury automatic out, and injury removal events
        if (
            log.eventType === "SUB" ||
            log.eventType === "opponent_lineup_pointer" ||
            log.eventType === "injury_auto_out" ||
            log.eventType === "INJURY_REMOVE"
        )
            return;

        // Filter based on whether we are calculating stats for our team or opponent team
        if (isOpponentPlay(log, isHomeGame) !== isOpponent) return;

        const batterId = log.playerId;
        if (!statsMap[batterId]) {
            if (!ensureOpponentBatter(batterId)) {
                return; // Skip if player not in chart (shouldn't happen)
            }
        }

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

        // Track Strikeouts
        if (eventType === "K" || standardizedEvent === "strikeout") {
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
        } catch (_e) {
            console.warn("Stats: Failed to parse baseState", log);
        }

        // Credit runs to ANY player who scored on this play
        if (baseState.scored && Array.isArray(baseState.scored)) {
            baseState.scored.forEach((scoredPlayerId) => {
                ensureOpponentBatter(scoredPlayerId);
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
            stat.AB > 0 ? formatStat((stat.H / stat.AB).toFixed(3)) : ".000";

        // OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
        // Simplified: (H + BB) / (AB + BB + SF) (ignoring HBP for now as we don't track them)
        const obpNumerator = stat.H + stat.BB;
        const obpDenominator = stat.AB + stat.BB + stat.SF;
        stat.OBP =
            obpDenominator > 0
                ? formatStat((obpNumerator / obpDenominator).toFixed(3))
                : ".000";

        // SLG = (1B + 2*2B + 3*3B + 4*HR) / AB
        const totalBases =
            stat["1B"] + 2 * stat["2B"] + 3 * stat["3B"] + 4 * stat.HR;
        stat.SLG =
            stat.AB > 0
                ? formatStat((totalBases / stat.AB).toFixed(3))
                : ".000";

        // OPS = OBP + SLG
        // Note: We need floating point values for accurate addition, then format
        const obpVal = parseFloat(stat.OBP || 0);
        const slgVal = parseFloat(stat.SLG || 0);
        stat.OPS = formatStat((obpVal + slgVal).toFixed(3));
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
        totals.AB > 0 ? formatStat((totals.H / totals.AB).toFixed(3)) : ".000";

    const obpNumerator = totals.H + totals.BB;
    const obpDenominator = totals.AB + totals.BB + totals.SF;
    totals.OBP =
        obpDenominator > 0
            ? formatStat((obpNumerator / obpDenominator).toFixed(3))
            : ".000";

    const totalBases =
        totals["1B"] + 2 * totals["2B"] + 3 * totals["3B"] + 4 * totals.HR;
    totals.SLG =
        totals.AB > 0
            ? formatStat((totalBases / totals.AB).toFixed(3))
            : ".000";

    const obpVal = parseFloat(totals.OBP || 0);
    const slgVal = parseFloat(totals.SLG || 0);
    totals.OPS = formatStat((obpVal + slgVal).toFixed(3));

    return totals;
};

/**
 * Calculate statistics for a single player based on a set of game logs.
 * Returns an object with detailed counts and calculated rates.
 *
 * @param {Array} logs - Array of game log objects for a single player
 * @returns {Object} Stats object
 */
export const calculatePlayerStats = (logs, userId) => {
    let hits = 0;
    let ab = 0; // At Bats
    let rbi = 0;
    let runs = 0;
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
        if (log.eventType === "opponent_run" || isOpponentPlay(log)) return;
        if (
            log.eventType === "injury_auto_out" ||
            log.eventType === "INJURY_REMOVE" ||
            log.eventType === "SUB" ||
            log.eventType === "opponent_lineup_pointer"
        )
            return;

        const isUsersAtBat = log.playerId === userId;

        // Count RBI only if it's the user's at-bat
        if (isUsersAtBat) {
            const logRbi = log.rbi || 0;
            rbi += logRbi;
            details.RBI += logRbi;
        }

        // Parse baseState to check for runs
        let baseState = {};
        try {
            baseState =
                typeof log.baseState === "string"
                    ? JSON.parse(log.baseState)
                    : log.baseState || {};
        } catch (_e) {}

        const scoredList = log.scored || baseState.scored || [];
        if (Array.isArray(scoredList) && scoredList.includes(userId)) {
            runs++;
        }

        // Only count hitting stats (AB, Hits, etc) if this log belongs to the user's at-bat
        if (!isUsersAtBat) return;

        const eventType = log.eventType;

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
            case "strikeout":
            case "ground_out":
            case "fly_out":
            case "line_out":
            case "pop_out":
                ab++;
                details.Outs++;
                // Track strikeout specifically
                if (eventType === "K" || type === "strikeout") {
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
        runs,
        doubles,
        triples,
        homeruns,
        details,
        calculated: {
            avg: formatStat(avg),
            obp: formatStat(obp),
            slg: formatStat(slg),
            ops: formatStat(ops),
        },
    };
};

/**
 * Default platform benchmark statistics for amateur softball.
 */
export const PLATFORM_BENCHMARKS = {
    RPG: 11.5,
    HitsPerGame: 14.0,
    AVG: 0.475,
    SLG: 0.72,
    NetDiffPerGame: 0.0,
    RAPG: 11.5,
};

/**
 * Calculate normalized season metrics (0-100 scale) and raw values for the Season Radar Chart.
 *
 * @param {Object} params - Input parameters
 * @param {Array} params.games - Array of game documents for the season
 * @param {Object} [params.totals] - Pre-calculated team totals object from calculateTeamTotals
 * @param {Object} [params.platformBenchmarks] - Optional platform benchmark overrides
 * @returns {Object} Metric values including normalized scores (0-100) and formatted raw numbers
 */
export function calculateSeasonRadarMetrics({
    games = [],
    totals = {},
    logs = [],
    platformBenchmarks = PLATFORM_BENCHMARKS,
}) {
    const completedGames = games.filter(
        (g) => g.result != null || g.score != null || g.opponentScore != null,
    );
    const gamesPlayed = completedGames.length || games.length || 0;

    const totalRunsScored = completedGames.reduce(
        (acc, g) => acc + (Number(g.score) || 0),
        0,
    );
    const totalRunsAllowed = completedGames.reduce(
        (acc, g) => acc + (Number(g.opponentScore) || 0),
        0,
    );

    const rpg = gamesPlayed > 0 ? totalRunsScored / gamesPlayed : 0;
    const rapg = gamesPlayed > 0 ? totalRunsAllowed / gamesPlayed : 0;
    const netDiff = rpg - rapg;

    // Filter games with play-by-play logs to avoid diluting hitting stats for legacy games
    const loggedGameIds = new Set(
        logs.map((log) => log.gameId).filter(Boolean),
    );
    const loggedGamesCount =
        loggedGameIds.size || (totals.AB > 0 ? gamesPlayed : 0);
    const hittingGamesDenominator =
        loggedGamesCount > 0 ? loggedGamesCount : gamesPlayed;

    const totalHits = totals.H || 0;
    const hpg =
        hittingGamesDenominator > 0 ? totalHits / hittingGamesDenominator : 0;

    const avgVal = parseFloat(totals.AVG || "0");
    const slgVal = parseFloat(totals.SLG || "0");

    // Standard ceiling normalization (0-100 scale)
    const scaledRPG = Math.min(100, Math.max(0, Math.round((rpg / 20) * 100)));
    const scaledHPG = Math.min(100, Math.max(0, Math.round((hpg / 25) * 100)));
    const scaledAVG = Math.min(
        100,
        Math.max(0, Math.round((avgVal / 0.7) * 100)),
    );
    const scaledSLG = Math.min(
        100,
        Math.max(0, Math.round((slgVal / 1.2) * 100)),
    );
    const scaledNetDiff = Math.min(
        100,
        Math.max(0, Math.round(((netDiff + 15) / 30) * 100)),
    );
    const scaledDef = Math.min(
        100,
        Math.max(0, Math.round((1 - Math.min(rapg, 20) / 20) * 100)),
    );

    // Platform relative scores (where 50 = platform average)
    const pRpg = platformBenchmarks.RPG || 11.5;
    const pHpg = platformBenchmarks.HitsPerGame || 14.0;
    const pAvg = platformBenchmarks.AVG || 0.475;
    const pSlg = platformBenchmarks.SLG || 0.72;
    const pRapg = platformBenchmarks.RAPG || 11.5;

    const relRPG = Math.min(
        100,
        Math.max(0, Math.round((rpg / (pRpg * 2)) * 100)),
    );
    const relHPG = Math.min(
        100,
        Math.max(0, Math.round((hpg / (pHpg * 2)) * 100)),
    );
    const relAVG = Math.min(
        100,
        Math.max(0, Math.round((avgVal / (pAvg * 2)) * 100)),
    );
    const relSLG = Math.min(
        100,
        Math.max(0, Math.round((slgVal / (pSlg * 2)) * 100)),
    );
    const relNetDiff = scaledNetDiff;
    const relDef = Math.min(
        100,
        Math.max(
            0,
            Math.round((1 - Math.min(rapg, pRapg * 2) / (pRapg * 2)) * 100),
        ),
    );

    return {
        gamesPlayed,
        loggedGamesCount,
        hasLegacyUnloggedGames:
            loggedGamesCount < gamesPlayed && gamesPlayed > 0,
        raw: {
            RPG: parseFloat(rpg.toFixed(1)),
            HPG: parseFloat(hpg.toFixed(1)),
            AVG: avgVal > 0 ? totals.AVG : ".000",
            SLG: slgVal > 0 ? totals.SLG : ".000",
            NetDiff: parseFloat(netDiff.toFixed(1)),
            RAPG: parseFloat(rapg.toFixed(1)),
        },
        fixedScores: {
            RPG: scaledRPG,
            HPG: scaledHPG,
            AVG: scaledAVG,
            SLG: scaledSLG,
            NetDiff: scaledNetDiff,
            Defense: scaledDef,
        },
        platformScores: {
            RPG: relRPG,
            HPG: relHPG,
            AVG: relAVG,
            SLG: relSLG,
            NetDiff: relNetDiff,
            Defense: relDef,
        },
    };
}

/**
 * Default platform hitter benchmark statistics.
 */
export const PLAYER_PLATFORM_BENCHMARKS = {
    HPG: 1.68,
    RBIPG: 1.21,
    RPG: 1.14,
    AVG: 0.438,
    SLG: 0.627,
    OPS: 1.082,
};

/**
 * Calculate dynamic platform hitter benchmarks from a sample of platform game logs.
 *
 * @param {Array<Object>} logs - Array of game logs across the platform
 * @returns {Object} Hitter benchmark stats (HPG, RBIPG, RPG, AVG, SLG, OPS)
 */
export function calculatePlatformBenchmarks(logs = []) {
    if (!Array.isArray(logs) || logs.length === 0) {
        return PLAYER_PLATFORM_BENCHMARKS;
    }

    const hittingLogs = logs.filter((log) => {
        const type = (log.eventType || "").toUpperCase();
        return (
            type &&
            type !== "SUB" &&
            type !== "INJURY_AUTO_OUT" &&
            type !== "INJURY_REMOVE"
        );
    });

    if (hittingLogs.length === 0) {
        return PLAYER_PLATFORM_BENCHMARKS;
    }

    // Group logs by player to calculate total player-game appearances across the platform sample
    const playerGameMap = {};
    let hits = 0;
    let ab = 0;
    let rbi = 0;
    let runs = 0;
    let tb = 0;
    let bb = 0;
    let sf = 0;
    let singles = 0;
    let doubles = 0;
    let triples = 0;
    let hr = 0;
    let k = 0;
    let go = 0;
    let fo = 0;
    let lo = 0;
    let po = 0;
    let e = 0;
    let fc = 0;

    hittingLogs.forEach((log) => {
        if (log.playerId && log.gameId) {
            if (!playerGameMap[log.playerId]) {
                playerGameMap[log.playerId] = new Set();
            }
            playerGameMap[log.playerId].add(log.gameId);
        }

        const rawType = log.eventType || "";
        let type = rawType.toLowerCase();
        if (Object.keys(EVENT_TYPE_MAP).includes(rawType)) {
            type = EVENT_TYPE_MAP[rawType];
        }

        switch (type) {
            case "single":
            case "1b":
                hits++;
                singles++;
                ab++;
                tb += 1;
                break;
            case "double":
            case "2b":
                hits++;
                doubles++;
                ab++;
                tb += 2;
                break;
            case "triple":
            case "3b":
                hits++;
                triples++;
                ab++;
                tb += 3;
                break;
            case "homerun":
            case "hr":
                hits++;
                hr++;
                ab++;
                tb += 4;
                break;
            case "walk":
            case "bb":
                bb++;
                break;
            case "strikeout":
            case "k":
                ab++;
                k++;
                break;
            case "ground_out":
                ab++;
                go++;
                break;
            case "fly_out":
            case "fly_pop":
                ab++;
                fo++;
                break;
            case "line_out":
                ab++;
                lo++;
                break;
            case "pop_out":
                ab++;
                po++;
                break;
            case "error":
            case "e":
                ab++;
                e++;
                break;
            case "fielders_choice":
            case "fc":
                ab++;
                fc++;
                break;
            case "out":
                ab++;
                break;
            case "sacrifice_fly":
            case "sf":
                sf++;
                break;
            default:
                break;
        }

        rbi += log.rbi || 0;

        if (Array.isArray(log.baseState?.scored)) {
            runs += log.baseState.scored.length;
        } else if (typeof log.baseState === "string") {
            try {
                const parsed = JSON.parse(log.baseState);
                if (Array.isArray(parsed.scored)) runs += parsed.scored.length;
            } catch (_e) {
                // Ignore parse errors
            }
        }
    });

    const totalPlayerGames =
        Object.values(playerGameMap).reduce((sum, set) => sum + set.size, 0) ||
        1;

    const hpg = hits / totalPlayerGames;
    const rbipg = rbi / totalPlayerGames;
    const rpg = runs / totalPlayerGames;
    const avg = ab > 0 ? hits / ab : 0.438;
    const obp = ab + bb + sf > 0 ? (hits + bb) / (ab + bb + sf) : 0.45;
    const slg = ab > 0 ? tb / ab : 0.627;
    const ops = obp + slg;

    return {
        totalHits: hits,
        totalAB: ab,
        totalTB: tb,
        totalRBIs: rbi,
        totalRuns: runs,
        totalPlayerGames,
        totalSingles: singles,
        totalDoubles: doubles,
        totalTriples: triples,
        totalHR: hr,
        totalBB: bb,
        totalK: k,
        totalSF: sf,
        totalGO: go,
        totalFO: fo,
        totalLO: lo,
        totalPO: po,
        totalE: e,
        totalFC: fc,
        HPG: parseFloat(hpg.toFixed(2)),
        RBIPG: parseFloat(rbipg.toFixed(2)),
        RPG: parseFloat(rpg.toFixed(2)),
        AVG: parseFloat(avg.toFixed(3)),
        SLG: parseFloat(slg.toFixed(3)),
        OPS: parseFloat(ops.toFixed(3)),
    };
}

/**
 * Apply a play log event or undo action to a user_stats_summary document payload.
 *
 * @param {Object} currentDoc - Existing aggregate document data (or empty initial object)
 * @param {Object} log - Play log document/event
 * @param {number} [direction=1] - +1 for adding an event, -1 for undoing an event
 * @returns {Object} Updated aggregate data payload
 */
export function applyLogToAggregate(currentDoc = {}, log = {}, direction = 1) {
    const dir = direction >= 0 ? 1 : -1;
    const rawType = log.eventType || "";
    let type = rawType.toLowerCase();
    if (Object.keys(EVENT_TYPE_MAP).includes(rawType)) {
        type = EVENT_TYPE_MAP[rawType];
    }

    let hitsDelta = 0;
    let abDelta = 0;
    let tbDelta = 0;
    let bbDelta = 0;
    let sfDelta = 0;
    let kDelta = 0;
    let singleDelta = 0;
    let doubleDelta = 0;
    let tripleDelta = 0;
    let hrDelta = 0;
    let goDelta = 0;
    let foDelta = 0;
    let loDelta = 0;
    let poDelta = 0;
    let eDelta = 0;
    let fcDelta = 0;

    switch (type) {
        case "single":
        case "1b":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 1;
            singleDelta = 1;
            break;
        case "double":
        case "2b":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 2;
            doubleDelta = 1;
            break;
        case "triple":
        case "3b":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 3;
            tripleDelta = 1;
            break;
        case "homerun":
        case "hr":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 4;
            hrDelta = 1;
            break;
        case "walk":
        case "bb":
            bbDelta = 1;
            break;
        case "strikeout":
        case "k":
            abDelta = 1;
            kDelta = 1;
            break;
        case "ground_out":
            abDelta = 1;
            goDelta = 1;
            break;
        case "fly_out":
        case "fly_pop":
            abDelta = 1;
            foDelta = 1;
            break;
        case "line_out":
            abDelta = 1;
            loDelta = 1;
            break;
        case "pop_out":
            abDelta = 1;
            poDelta = 1;
            break;
        case "error":
        case "e":
            abDelta = 1;
            eDelta = 1;
            break;
        case "fielders_choice":
        case "fc":
            abDelta = 1;
            fcDelta = 1;
            break;
        case "out":
            abDelta = 1;
            break;
        case "sacrifice_fly":
        case "sf":
            sfDelta = 1;
            break;
        default:
            break;
    }

    let runsDelta = 0;
    if (Array.isArray(log.baseState?.scored)) {
        runsDelta = log.baseState.scored.length;
    } else if (typeof log.baseState === "string") {
        try {
            const parsed = JSON.parse(log.baseState);
            if (Array.isArray(parsed.scored)) runsDelta = parsed.scored.length;
        } catch (_e) {
            // Ignore
        }
    }

    const rbiDelta = log.rbi || 0;

    const newHits = Math.max(0, (currentDoc.hits || 0) + hitsDelta * dir);
    const newAB = Math.max(0, (currentDoc.ab || 0) + abDelta * dir);
    const newTB = Math.max(0, (currentDoc.tb || 0) + tbDelta * dir);
    const newBB = Math.max(0, (currentDoc.walks || 0) + bbDelta * dir);
    const newSF = Math.max(0, (currentDoc.sf || 0) + sfDelta * dir);
    const newK = Math.max(0, (currentDoc.strikeouts || 0) + kDelta * dir);
    const newSingles = Math.max(
        0,
        (currentDoc.singles || 0) + singleDelta * dir,
    );
    const newDoubles = Math.max(
        0,
        (currentDoc.doubles || 0) + doubleDelta * dir,
    );
    const newTriples = Math.max(
        0,
        (currentDoc.triples || 0) + tripleDelta * dir,
    );
    const newHR = Math.max(0, (currentDoc.homeruns || 0) + hrDelta * dir);
    const newGO = Math.max(0, (currentDoc.groundOuts || 0) + goDelta * dir);
    const newFO = Math.max(0, (currentDoc.flyOuts || 0) + foDelta * dir);
    const newLO = Math.max(0, (currentDoc.lineOuts || 0) + loDelta * dir);
    const newPO = Math.max(0, (currentDoc.popOuts || 0) + poDelta * dir);
    const newE = Math.max(0, (currentDoc.errors || 0) + eDelta * dir);
    const newFC = Math.max(0, (currentDoc.fieldersChoice || 0) + fcDelta * dir);
    const newRBI = Math.max(0, (currentDoc.rbi || 0) + rbiDelta * dir);
    const newRuns = Math.max(0, (currentDoc.runs || 0) + runsDelta * dir);
    const gameCount = currentDoc.gameCount || 0;

    const avg = newAB > 0 ? newHits / newAB : 0;
    const obp =
        newAB + newBB + newSF > 0
            ? (newHits + newBB) / (newAB + newBB + newSF)
            : 0;
    const slg = newAB > 0 ? newTB / newAB : 0;
    const ops = obp + slg;

    return {
        ...currentDoc,
        userId: log.playerId || currentDoc.userId,
        hits: newHits,
        ab: newAB,
        tb: newTB,
        walks: newBB,
        sf: newSF,
        strikeouts: newK,
        singles: newSingles,
        doubles: newDoubles,
        triples: newTriples,
        homeruns: newHR,
        groundOuts: newGO,
        flyOuts: newFO,
        lineOuts: newLO,
        popOuts: newPO,
        errors: newE,
        fieldersChoice: newFC,
        rbi: newRBI,
        runs: newRuns,
        gameCount,
        avg: parseFloat(avg.toFixed(3)),
        slg: parseFloat(slg.toFixed(3)),
        ops: parseFloat(ops.toFixed(3)),
    };
}

/**
 * Apply a play log event or undo action to a platform_benchmarks document payload.
 *
 * @param {Object} currentBench - Existing platform benchmark document data (or empty initial object)
 * @param {Object} log - Play log document/event
 * @param {number} [direction=1] - +1 for adding an event, -1 for undoing an event
 * @returns {Object} Updated platform benchmark payload
 */
export function applyLogToPlatformBenchmark(
    currentBench = {},
    log = {},
    direction = 1,
) {
    const dir = direction >= 0 ? 1 : -1;
    const rawType = log.eventType || "";
    let type = rawType.toLowerCase();
    if (Object.keys(EVENT_TYPE_MAP).includes(rawType)) {
        type = EVENT_TYPE_MAP[rawType];
    }

    let hitsDelta = 0;
    let abDelta = 0;
    let tbDelta = 0;
    let bbDelta = 0;
    let sfDelta = 0;
    let kDelta = 0;
    let singleDelta = 0;
    let doubleDelta = 0;
    let tripleDelta = 0;
    let hrDelta = 0;
    let goDelta = 0;
    let foDelta = 0;
    let loDelta = 0;
    let poDelta = 0;
    let eDelta = 0;
    let fcDelta = 0;

    switch (type) {
        case "single":
        case "1b":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 1;
            singleDelta = 1;
            break;
        case "double":
        case "2b":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 2;
            doubleDelta = 1;
            break;
        case "triple":
        case "3b":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 3;
            tripleDelta = 1;
            break;
        case "homerun":
        case "hr":
            hitsDelta = 1;
            abDelta = 1;
            tbDelta = 4;
            hrDelta = 1;
            break;
        case "walk":
        case "bb":
            bbDelta = 1;
            break;
        case "strikeout":
        case "k":
            abDelta = 1;
            kDelta = 1;
            break;
        case "ground_out":
            abDelta = 1;
            goDelta = 1;
            break;
        case "fly_out":
        case "fly_pop":
            abDelta = 1;
            foDelta = 1;
            break;
        case "line_out":
            abDelta = 1;
            loDelta = 1;
            break;
        case "pop_out":
            abDelta = 1;
            poDelta = 1;
            break;
        case "error":
        case "e":
            abDelta = 1;
            eDelta = 1;
            break;
        case "fielders_choice":
        case "fc":
            abDelta = 1;
            fcDelta = 1;
            break;
        case "out":
            abDelta = 1;
            break;
        case "sacrifice_fly":
        case "sf":
            sfDelta = 1;
            break;
        default:
            break;
    }

    let runsDelta = 0;
    if (Array.isArray(log.baseState?.scored)) {
        runsDelta = log.baseState.scored.length;
    } else if (typeof log.baseState === "string") {
        try {
            const parsed = JSON.parse(log.baseState);
            if (Array.isArray(parsed.scored)) runsDelta = parsed.scored.length;
        } catch (_e) {
            // Ignore
        }
    }

    const rbiDelta = log.rbi || 0;

    const totalHits = Math.max(
        0,
        (currentBench.totalHits || 0) + hitsDelta * dir,
    );
    const totalAB = Math.max(0, (currentBench.totalAB || 0) + abDelta * dir);
    const totalTB = Math.max(0, (currentBench.totalTB || 0) + tbDelta * dir);
    const totalBB = Math.max(0, (currentBench.totalBB || 0) + bbDelta * dir);
    const totalSF = Math.max(0, (currentBench.totalSF || 0) + sfDelta * dir);
    const totalK = Math.max(0, (currentBench.totalK || 0) + kDelta * dir);
    const totalSingles = Math.max(
        0,
        (currentBench.totalSingles || 0) + singleDelta * dir,
    );
    const totalDoubles = Math.max(
        0,
        (currentBench.totalDoubles || 0) + doubleDelta * dir,
    );
    const totalTriples = Math.max(
        0,
        (currentBench.totalTriples || 0) + tripleDelta * dir,
    );
    const totalHR = Math.max(0, (currentBench.totalHR || 0) + hrDelta * dir);
    const totalGO = Math.max(0, (currentBench.totalGO || 0) + goDelta * dir);
    const totalFO = Math.max(0, (currentBench.totalFO || 0) + foDelta * dir);
    const totalLO = Math.max(0, (currentBench.totalLO || 0) + loDelta * dir);
    const totalPO = Math.max(0, (currentBench.totalPO || 0) + poDelta * dir);
    const totalE = Math.max(0, (currentBench.totalE || 0) + eDelta * dir);
    const totalFC = Math.max(0, (currentBench.totalFC || 0) + fcDelta * dir);
    const totalRBIs = Math.max(
        0,
        (currentBench.totalRBIs || 0) + rbiDelta * dir,
    );
    const totalRuns = Math.max(
        0,
        (currentBench.totalRuns || 0) + runsDelta * dir,
    );
    const totalPlayerGames = Math.max(1, currentBench.totalPlayerGames || 1);

    const hpg = totalHits / totalPlayerGames;
    const rbipg = totalRBIs / totalPlayerGames;
    const rpg = totalRuns / totalPlayerGames;
    const avg = totalAB > 0 ? totalHits / totalAB : 0.438;
    const obp =
        totalAB + totalBB + totalSF > 0
            ? (totalHits + totalBB) / (totalAB + totalBB + totalSF)
            : 0.45;
    const slg = totalAB > 0 ? totalTB / totalAB : 0.627;
    const ops = obp + slg;

    return {
        ...currentBench,
        totalHits,
        totalAB,
        totalTB,
        totalBB,
        totalSF,
        totalK,
        totalSingles,
        totalDoubles,
        totalTriples,
        totalHR,
        totalGO,
        totalFO,
        totalLO,
        totalPO,
        totalE,
        totalFC,
        totalRBIs,
        totalRuns,
        totalPlayerGames,
        HPG: parseFloat(hpg.toFixed(2)),
        RBIPG: parseFloat(rbipg.toFixed(2)),
        RPG: parseFloat(rpg.toFixed(2)),
        AVG: parseFloat(avg.toFixed(3)),
        SLG: parseFloat(slg.toFixed(3)),
        OPS: parseFloat(ops.toFixed(3)),
    };
}

/**
 * Calculate normalized player hitting metrics (0-100 scale) and raw values for the Player Performance Radar Chart.
 *
 * @param {Object} params - Input parameters
 * @param {Object} params.overallStats - Calculated player stats from calculatePlayerStats
 * @param {number} params.gameCountWithLogs - Count of unique games with detailed logs for the player
 * @param {Object} [params.platformBenchmarks] - Platform hitter benchmark averages
 * @returns {Object} Calculated raw values, radar data array, and platform baseline
 */
export function calculatePlayerRadarMetrics({
    overallStats,
    gameCountWithLogs = 0,
    platformBenchmarks = PLAYER_PLATFORM_BENCHMARKS,
}) {
    if (!overallStats || gameCountWithLogs <= 0) {
        return {
            radarData: [],
            raw: {
                HPG: "0.00",
                RBIPG: "0.00",
                RPG: "0.00",
                AVG: ".000",
                SLG: ".000",
                OPS: ".000",
            },
            platformRaw: {
                HPG: "1.68",
                RBIPG: "1.21",
                RPG: "1.14",
                AVG: ".438",
                SLG: ".627",
                OPS: "1.082",
            },
        };
    }

    const hits = overallStats.hits || 0;
    const rbi = overallStats.rbi || 0;
    const runs = overallStats.runs || 0;

    const hpg = hits / gameCountWithLogs;
    const rbipg = rbi / gameCountWithLogs;
    const rpg = runs / gameCountWithLogs;

    const avgVal = parseFloat(overallStats.calculated?.avg || "0");
    const slgVal = parseFloat(overallStats.calculated?.slg || "0");
    const opsVal = parseFloat(overallStats.calculated?.ops || "0");

    // Platform benchmark values
    const pHpg = platformBenchmarks.HPG ?? 1.68;
    const pRbipg = platformBenchmarks.RBIPG ?? 1.21;
    const pRpg = platformBenchmarks.RPG ?? 1.14;
    const pAvg = platformBenchmarks.AVG ?? 0.438;
    const pSlg = platformBenchmarks.SLG ?? 0.627;
    const pOps = platformBenchmarks.OPS ?? 1.082;

    // Scale mapping to 0-100 range
    const normPlayerHPG = Math.min(
        100,
        Math.max(0, Math.round((hpg / 4.0) * 100)),
    );
    const normPlayerRBIPG = Math.min(
        100,
        Math.max(0, Math.round((rbipg / 3.5) * 100)),
    );
    const normPlayerRPG = Math.min(
        100,
        Math.max(0, Math.round((rpg / 3.5) * 100)),
    );
    const normPlayerAVG = Math.min(100, Math.max(0, Math.round(avgVal * 100)));
    const normPlayerSLG = Math.min(
        100,
        Math.max(0, Math.round((slgVal / 2.0) * 100)),
    );
    const normPlayerOPS = Math.min(
        100,
        Math.max(0, Math.round((opsVal / 3.0) * 100)),
    );

    const normPlatformHPG = Math.min(
        100,
        Math.max(0, Math.round((pHpg / 4.0) * 100)),
    );
    const normPlatformRBIPG = Math.min(
        100,
        Math.max(0, Math.round((pRbipg / 3.5) * 100)),
    );
    const normPlatformRPG = Math.min(
        100,
        Math.max(0, Math.round((pRpg / 3.5) * 100)),
    );
    const normPlatformAVG = Math.min(100, Math.max(0, Math.round(pAvg * 100)));
    const normPlatformSLG = Math.min(
        100,
        Math.max(0, Math.round((pSlg / 2.0) * 100)),
    );
    const normPlatformOPS = Math.min(
        100,
        Math.max(0, Math.round((pOps / 3.0) * 100)),
    );

    const radarData = [
        {
            metric: "HPG",
            fullMetric: "Hits / Gm",
            playerScore: normPlayerHPG,
            platformScore: normPlatformHPG,
            playerRaw: hpg.toFixed(2),
            platformRaw: pHpg.toFixed(2),
        },
        {
            metric: "RBIPG",
            fullMetric: "RBIs / Gm",
            playerScore: normPlayerRBIPG,
            platformScore: normPlatformRBIPG,
            playerRaw: rbipg.toFixed(2),
            platformRaw: pRbipg.toFixed(2),
        },
        {
            metric: "RPG",
            fullMetric: "Runs / Gm",
            playerScore: normPlayerRPG,
            platformScore: normPlatformRPG,
            playerRaw: rpg.toFixed(2),
            platformRaw: pRpg.toFixed(2),
        },
        {
            metric: "AVG",
            fullMetric: "Batting AVG",
            playerScore: normPlayerAVG,
            platformScore: normPlatformAVG,
            playerRaw: overallStats.calculated?.avg || ".000",
            platformRaw: pAvg.toFixed(3).replace(/^0/, ""),
        },
        {
            metric: "SLG",
            fullMetric: "Slugging",
            playerScore: normPlayerSLG,
            platformScore: normPlatformSLG,
            playerRaw: overallStats.calculated?.slg || ".000",
            platformRaw: pSlg.toFixed(3).replace(/^0/, ""),
        },
        {
            metric: "OPS",
            fullMetric: "OPS",
            playerScore: normPlayerOPS,
            platformScore: normPlatformOPS,
            playerRaw: overallStats.calculated?.ops || ".000",
            platformRaw: pOps.toFixed(3).replace(/^0/, ""),
        },
    ];

    return {
        gameCountWithLogs,
        raw: {
            HPG: hpg.toFixed(2),
            RBIPG: rbipg.toFixed(2),
            RPG: rpg.toFixed(2),
            AVG: overallStats.calculated?.avg || ".000",
            SLG: overallStats.calculated?.slg || ".000",
            OPS: overallStats.calculated?.ops || ".000",
        },
        platformRaw: {
            HPG: pHpg.toFixed(2),
            RBIPG: pRbipg.toFixed(2),
            RPG: pRpg.toFixed(2),
            AVG: pAvg.toFixed(3).replace(/^0/, ""),
            SLG: pSlg.toFixed(3).replace(/^0/, ""),
            OPS: pOps.toFixed(3).replace(/^0/, ""),
        },
        radarData,
    };
}
