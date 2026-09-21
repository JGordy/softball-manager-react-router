import fs from "node:fs";
import path from "node:path";

let cachedLogoDataUri = null;

/**
 * Retrieves the base64 data URI of the RostrHQ shield logo.
 * Caches the result in memory for server-side performance.
 *
 * @returns {string} Data URI of the logo PNG.
 */
export function getLogoDataUri() {
    if (cachedLogoDataUri) return cachedLogoDataUri;
    try {
        const candidatePaths = [
            path.resolve(process.cwd(), "public/images/splash-shield-icon.png"),
            path.resolve(
                process.cwd(),
                "public/android-chrome-icon-512x512.png",
            ),
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                const buf = fs.readFileSync(p);
                cachedLogoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
                return cachedLogoDataUri;
            }
        }
    } catch (_e) {
        // Fallback gracefully
    }
    return "";
}

/**
 * Escapes special XML/SVG characters.
 *
 * @param {string} str - Raw input text.
 * @returns {string} Escaped XML string.
 */
function escapeXml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Generates an SVG string representing the high-resolution, Velocity Dark virtual scoreboard.
 *
 * @param {Object} params - Scoreboard data parameters.
 * @param {string} [params.teamName="Our Team"] - Name of the primary team.
 * @param {string} [params.opponentName="Opponent"] - Name of the opponent.
 * @param {number|string} [params.teamScore=0] - Team score.
 * @param {number|string} [params.opponentScore=0] - Opponent score.
 * @param {boolean} [params.isGameFinal=false] - Whether the game is final.
 * @param {string} [params.statusBadge] - Custom badge text override (e.g. "FINAL", "LIVE").
 * @param {string} [params.venue] - Park or field name.
 * @param {string} [params.seasonName] - Season name (e.g. "Fall 2026").
 * @param {string} [params.inningText] - Inning count or status (e.g. "7 Innings").
 * @param {string} [params.logoDataUri] - Optional custom data URI for the logo.
 * @returns {string} Complete valid SVG markup.
 */
export function generateScoreboardSvg({
    teamName = "Our Team",
    opponentName = "Opponent",
    teamScore = 0,
    opponentScore = 0,
    isGameFinal = false,
    statusBadge = null,
    venue = "",
    seasonName = "",
    inningText = "",
    logoDataUri = null,
} = {}) {
    const logoUri = logoDataUri || getLogoDataUri();
    const tScore = Number(teamScore || 0);
    const oScore = Number(opponentScore || 0);

    const badgeText =
        statusBadge ||
        (isGameFinal
            ? "FINAL"
            : tScore > 0 || oScore > 0
              ? "LIVE"
              : "UPCOMING");

    const team1Bold = isGameFinal ? tScore >= oScore : true;
    const team2Bold = isGameFinal ? oScore > tScore : true;

    const team1Color = team1Bold ? "#FFFFFF" : "#9CA3AF";
    const team2Color = team2Bold ? "#FFFFFF" : "#9CA3AF";
    const team1ScoreColor = team1Bold ? "#FFFFFF" : "#9CA3AF";
    const team2ScoreColor = team2Bold ? "#FFFFFF" : "#9CA3AF";

    // Build context line
    const contextItems = [];
    if (venue) contextItems.push(venue);
    if (inningText) contextItems.push(inningText);
    else if (isGameFinal) contextItems.push("7 Innings");
    if (seasonName) contextItems.push(seasonName);
    const contextLine = contextItems.join("  •  ") || "RostrHQ Gameday";

    // Truncate names if overly long for 650px container, uppercase, then escape XML
    const rawTeam =
        teamName.length > 22 ? `${teamName.slice(0, 20)}...` : teamName;
    const rawOpponent =
        opponentName.length > 22
            ? `${opponentName.slice(0, 20)}...`
            : opponentName;

    const safeTeamName = escapeXml(rawTeam.toUpperCase());
    const safeOpponentName = escapeXml(rawOpponent.toUpperCase());
    const safeContext = escapeXml(contextLine);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="card-shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6" />
    </filter>
    <linearGradient id="card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#243042" />
      <stop offset="100%" stop-color="#1A2332" />
    </linearGradient>
    <linearGradient id="border-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#CCFF33" stop-opacity="0.8" />
      <stop offset="40%" stop-color="#374151" stop-opacity="0.4" />
      <stop offset="80%" stop-color="#374151" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#CCFF33" stop-opacity="0.9" />
    </linearGradient>
    <clipPath id="card-clip">
      <rect x="80" y="85" width="1040" height="460" rx="24" ry="24" />
    </clipPath>
  </defs>

  <!-- Clean Midnight Navy Background -->
  <rect width="1200" height="630" fill="#111827" />

  <!-- Unified Elevated Scoreboard Container -->
  <rect x="80" y="85" width="1040" height="460" rx="24" ry="24" fill="url(#card-grad)" filter="url(#card-shadow)" />
  
  <!-- Subtle Neon Accent Rim -->
  <rect x="80" y="85" width="1040" height="460" rx="24" ry="24" fill="none" stroke="url(#border-neon)" stroke-width="2.5" />

  <!-- Content Group clipped to card bounds for clean corners -->
  <g clip-path="url(#card-clip)">
    <!-- Bottom Footer Bar -->
    <rect x="80" y="475" width="1040" height="70" fill="#141B26" />
    <line x1="80" y1="475" x2="1120" y2="475" stroke="#2B3648" stroke-width="1.5" />
    <text x="600" y="518" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Open Sans', sans-serif" font-size="21" font-weight="600" fill="#9CA3AF" text-anchor="middle" letter-spacing="0.5">${safeContext}</text>

    <!-- Left Column: Shield Logo & Status Badge (x: 80 to 390) -->
    <!-- Center of left column is x = 235. Center of scoreboard area (y: 85 to 475) is y = 280 -->
    <g transform="translate(145, 140)">
      ${
          logoUri
              ? `<image href="${logoUri}" x="0" y="0" width="180" height="180" />`
              : `<rect x="0" y="0" width="180" height="180" rx="20" fill="#111827" stroke="#CCFF33" stroke-width="3" />
                 <text x="90" y="105" font-family="-apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="72" font-weight="900" fill="#CCFF33" text-anchor="middle">R</text>`
      }
      
      <!-- Glowing FINAL / LIVE status badge directly centered below shield -->
      <g transform="translate(10, 205)">
        <rect x="0" y="0" width="160" height="48" rx="14" fill="#CCFF33" filter="url(#neon-glow)" />
        <rect x="0" y="0" width="160" height="48" rx="14" fill="#CCFF33" />
        <text x="80" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="2.5">${escapeXml(badgeText)}</text>
      </g>
    </g>

    <!-- Vertical Column Divider -->
    <line x1="390" y1="125" x2="390" y2="435" stroke="#2B3648" stroke-width="2" />

    <!-- Right Column: Matchup Rows (x: 430 to 1060) -->
    <!-- Row 1: Team 1 -->
    <text x="440" y="215" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Open Sans', sans-serif" font-size="36" font-weight="800" fill="${team1Color}" letter-spacing="1">${safeTeamName}</text>
    <text x="1050" y="225" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Open Sans', sans-serif" font-size="76" font-weight="900" fill="${team1ScoreColor}" text-anchor="end">${tScore}</text>

    <!-- Horizontal Team Divider -->
    <line x1="440" y1="280" x2="1050" y2="280" stroke="#2B3648" stroke-width="2" />

    <!-- Row 2: Team 2 (Opponent) -->
    <text x="440" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Open Sans', sans-serif" font-size="36" font-weight="800" fill="${team2Color}" letter-spacing="1">${safeOpponentName}</text>
    <text x="1050" y="385" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Open Sans', sans-serif" font-size="76" font-weight="900" fill="${team2ScoreColor}" text-anchor="end">${oScore}</text>
  </g>
</svg>`;
}
