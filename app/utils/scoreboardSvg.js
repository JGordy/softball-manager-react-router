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
 * Splits a team name into a prefix (location/city) and primary mascot name.
 * e.g., "Ormewood Park Sliders" -> { prefix: "ORMEWOOD PARK", main: "SLIDERS" }
 *
 * @param {string} name - Raw team name.
 * @returns {{ prefix: string, main: string }} Split name components.
 */
export function splitTeamName(name) {
    if (!name || typeof name !== "string") {
        return { prefix: "", main: "TEAM" };
    }
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
        return { prefix: "", main: parts[0].toUpperCase() };
    }
    const main = parts[parts.length - 1].toUpperCase();
    const prefix = parts
        .slice(0, parts.length - 1)
        .join(" ")
        .toUpperCase();
    return { prefix, main };
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

    const team1Color = team1Bold ? "#FFFFFF" : "#8A99AD";
    const team2Color = team2Bold ? "#FFFFFF" : "#8A99AD";
    const team1PrefixColor = team1Bold ? "#FFFFFF" : "#8A99AD";
    const team2PrefixColor = team2Bold ? "#8A99AD" : "#6B7280";
    const team1ScoreColor = team1Bold ? "#FFFFFF" : "#8A99AD";
    const team2ScoreColor = team2Bold ? "#FFFFFF" : "#8A99AD";

    const team1Split = splitTeamName(teamName);
    const team2Split = splitTeamName(opponentName);

    const safeTeam1Prefix = escapeXml(team1Split.prefix);
    const safeTeam1Main = escapeXml(team1Split.main);
    const safeTeam2Prefix = escapeXml(team2Split.prefix);
    const safeTeam2Main = escapeXml(team2Split.main);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur" />
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
      <stop offset="0%" stop-color="#CCFF33" stop-opacity="0.85" />
      <stop offset="40%" stop-color="#374151" stop-opacity="0.4" />
      <stop offset="80%" stop-color="#374151" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#CCFF33" stop-opacity="0.9" />
    </linearGradient>
    <clipPath id="card-clip">
      <rect x="60" y="55" width="1080" height="520" rx="28" ry="28" />
    </clipPath>
  </defs>

  <!-- Clean Midnight Navy Background -->
  <rect width="1200" height="630" fill="#111827" />

  <!-- Unified Elevated Scoreboard Container -->
  <rect x="60" y="55" width="1080" height="520" rx="28" ry="28" fill="url(#card-grad)" filter="url(#card-shadow)" />
  
  <!-- Subtle Neon Accent Rim -->
  <rect x="60" y="55" width="1080" height="520" rx="28" ry="28" fill="none" stroke="url(#border-neon)" stroke-width="2.5" />

  <!-- Content Group clipped to card bounds for clean corners -->
  <g clip-path="url(#card-clip)">
    <!-- Left Column: Shield Logo & Status Badge (x: 60 to 370) -->
    <g transform="translate(85, 95)">
      ${
          logoUri
              ? `<image href="${logoUri}" x="0" y="0" width="260" height="260" />`
              : `<rect x="0" y="0" width="260" height="260" rx="32" fill="#111827" stroke="#CCFF33" stroke-width="3.5" />
                 <text x="130" y="165" font-family="system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif" font-size="115" font-weight="900" fill="#CCFF33" text-anchor="middle">R</text>`
      }
      
      <!-- Glowing FINAL / LIVE status badge directly centered below shield -->
      <g transform="translate(40, 285)">
        <rect x="0" y="0" width="180" height="56" rx="16" fill="#CCFF33" filter="url(#neon-glow)" />
        <rect x="0" y="0" width="180" height="56" rx="16" fill="#CCFF33" />
        <text x="90" y="38" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="3">${escapeXml(badgeText)}</text>
      </g>
    </g>

    <!-- Vertical Column Divider -->
    <line x1="370" y1="55" x2="370" y2="575" stroke="#2B3648" stroke-width="2" />

    <!-- Vertical Divider between Team Names and Scores -->
    <line x1="880" y1="55" x2="880" y2="575" stroke="#2B3648" stroke-width="1.5" />

    <!-- Right Column: Matchup Rows -->
    <!-- Row 1: Team 1 -->
    <g transform="translate(420, 0)">
      ${
          safeTeam1Prefix
              ? `<text x="0" y="155" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="800" fill="${team1PrefixColor}" letter-spacing="1">${safeTeam1Prefix}</text>
                 <text x="0" y="240" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="70" font-weight="900" fill="${team1Color}" letter-spacing="1">${safeTeam1Main}</text>`
              : `<text x="0" y="210" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="76" font-weight="900" fill="${team1Color}" letter-spacing="1">${safeTeam1Main}</text>`
      }
    </g>
    <text x="1010" y="222" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="110" font-weight="900" fill="${team1ScoreColor}" text-anchor="middle">${tScore}</text>

    <!-- Horizontal Team Divider -->
    <line x1="370" y1="315" x2="1140" y2="315" stroke="#2B3648" stroke-width="2" />

    <!-- Row 2: Team 2 (Opponent) -->
    <g transform="translate(420, 0)">
      ${
          safeTeam2Prefix
              ? `<text x="0" y="415" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="800" fill="${team2PrefixColor}" letter-spacing="1">${safeTeam2Prefix}</text>
                 <text x="0" y="500" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="70" font-weight="900" fill="${team2Color}" letter-spacing="1">${safeTeam2Main}</text>`
              : `<text x="0" y="470" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="76" font-weight="900" fill="${team2Color}" letter-spacing="1">${safeTeam2Main}</text>`
      }
    </g>
    <text x="1010" y="482" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="110" font-weight="900" fill="${team2ScoreColor}" text-anchor="middle">${oScore}</text>
  </g>
</svg>`;
}
