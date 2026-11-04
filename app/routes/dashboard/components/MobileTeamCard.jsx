import { Link } from "react-router";
import { Box, Text, VisuallyHidden, darken, lighten } from "@mantine/core";
import classes from "./MobileTeamCard.module.css";

/**
 * Exact irregular card body path matching the design reference (media_1793761535708.png):
 * Dynamic aerodynamic silhouette with gently arched top visor, straight vertical left edge,
 * and an organic inward scoop carving into the lower-right quadrant.
 */
const CARD_BODY_PATH =
    "M 42,20 Q 142,12 242,10 A 34,34 0 0 1 276,44 L 276,152 C 275,198 242,310 228,322 C 220,330 212,334 200,334 L 42,334 A 36,36 0 0 1 6,298 L 6,56 A 36,36 0 0 1 42,20 Z";

/**
 * Aerodynamic accent rail tracing the straight vertical outer perimeter and curving cleanly around the corner.
 */
const ACCENT_RAIL_PATH = "M 276,110 L 276,270 C 276,305 260,330 224,332";

/**
 * Generates SVG path data for the softball seam spine and chevron stitches.
 * Precalculated at module scope for maximum performance and zero recomputation.
 */
function getSoftballSeamPaths() {
    const p0 = { x: -10, y: 280 };
    const p1 = { x: 230, y: 240 };
    const p2 = { x: 265, y: -10 };

    const count = 30;
    const stitches = [];
    for (let i = 0; i <= count; i++) {
        const t = i / count;
        const x =
            (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
        const y =
            (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

        const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
        const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
        const len = Math.hypot(dx, dy) || 1;
        const tx = dx / len;
        const ty = dy / len;
        const nx = -ty;
        const ny = tx;

        const w = 10;
        const s = 5.5;

        const xLeft = (x - nx * w - tx * s).toFixed(1);
        const yLeft = (y - ny * w - ty * s).toFixed(1);
        const xMid = x.toFixed(1);
        const yMid = y.toFixed(1);
        const xRight = (x + nx * w - tx * s).toFixed(1);
        const yRight = (y + ny * w - ty * s).toFixed(1);

        stitches.push(
            `M ${xLeft},${yLeft} L ${xMid},${yMid} L ${xRight},${yRight}`,
        );
    }

    return {
        spine: `M ${p0.x},${p0.y} Q ${p1.x},${p1.y} ${p2.x},${p2.y}`,
        stitches: stitches.join(" "),
    };
}

const SEAM_PATHS = getSoftballSeamPaths();

/**
 * MobileTeamCard - Tall, immersive team carousel card with aerodynamic cinched silhouette,
 * softened fluid tone-on-tone color depth contours, and neutral softball seam watermark.
 *
 * @param {Object} props
 * @param {Object} props.team - Team object
 * @param {boolean} [props.isActive=false] - Whether card is active slide
 * @returns {JSX.Element}
 */
export default function MobileTeamCard({ team, isActive = false }) {
    const primaryColor = team?.primaryColor || "#6B0F1A";
    const teamId = team?.$id || "default";

    // Dynamically calculate tone-on-tone shades derived from the team's primary color
    const lightTone = lighten(primaryColor, 0.22);
    const vibrantTone = lighten(primaryColor, 0.4);
    const darkTone = darken(primaryColor, 0.35);
    const deepDarkTone = darken(primaryColor, 0.78);

    // Split team name into prefix and nickname
    const nameWords = (team?.name || "").trim().split(" ");
    let prefix = "";
    let nickname = team?.name || "";

    if (nameWords.length > 1) {
        nickname = nameWords.pop();
        prefix = nameWords.join(" ");
    }

    return (
        <Box
            component={Link}
            to={`/team/${team?.$id}`}
            className={`${classes.cardContainer} ${isActive ? classes.activeCard : classes.inactiveCard}`}
            style={{
                "--team-primary": primaryColor,
            }}
        >
            <svg
                className={classes.cardSvg}
                viewBox="0 0 290 340"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Dark Mode Base Gradient */}
                    <linearGradient
                        id={`cardBaseDark-${teamId}`}
                        x1="0"
                        y1="0"
                        x2="0.8"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor={lightTone}
                            stopOpacity="1"
                        />
                        <stop
                            offset="50%"
                            stopColor={primaryColor}
                            stopOpacity="0.9"
                        />
                        <stop
                            offset="100%"
                            stopColor={deepDarkTone}
                            stopOpacity="0.95"
                        />
                    </linearGradient>

                    {/* Light Mode Base Gradient (Vibrant Jersey) */}
                    <linearGradient
                        id={`cardBaseLight-${teamId}`}
                        x1="0"
                        y1="0"
                        x2="0.6"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor={lightTone}
                            stopOpacity="1"
                        />
                        <stop
                            offset="60%"
                            stopColor={primaryColor}
                            stopOpacity="0.95"
                        />
                        <stop
                            offset="100%"
                            stopColor={darkTone}
                            stopOpacity="0.9"
                        />
                    </linearGradient>

                    {/* Gaussian Blur Filter for Softened Color Transitions */}
                    <filter
                        id={`softenGrad-${teamId}`}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                    >
                        <feGaussianBlur stdDeviation="14" />
                    </filter>

                    {/* Sheen Overlay */}
                    <linearGradient
                        id={`sheenGrad-${teamId}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="rgba(255, 255, 255, 0.14)"
                        />
                        <stop
                            offset="45%"
                            stopColor="rgba(255, 255, 255, 0.02)"
                        />
                        <stop offset="100%" stopColor="rgba(0, 0, 0, 0.22)" />
                    </linearGradient>

                    {/* Sculpted Border Stroke */}
                    <linearGradient
                        id={`strokeGrad-${teamId}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="rgba(255, 255, 255, 0.45)"
                        />
                        <stop
                            offset="50%"
                            stopColor="rgba(255, 255, 255, 0.10)"
                        />
                        <stop
                            offset="100%"
                            stopColor={primaryColor}
                            stopOpacity="0.65"
                        />
                    </linearGradient>

                    {/* Accent Rail Gradient - Team Color Line with Smooth Fades at Both Ends */}
                    <linearGradient
                        id={`accentRail-${teamId}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor={darkTone}
                            stopOpacity="0"
                        />
                        <stop
                            offset="20%"
                            stopColor={primaryColor}
                            stopOpacity="0.6"
                        />
                        <stop
                            offset="50%"
                            stopColor={vibrantTone}
                            stopOpacity="0.95"
                        />
                        <stop
                            offset="80%"
                            stopColor={primaryColor}
                            stopOpacity="0.6"
                        />
                        <stop
                            offset="100%"
                            stopColor={darkTone}
                            stopOpacity="0"
                        />
                    </linearGradient>

                    {/* Clip Path matching the exact card silhouette */}
                    <clipPath
                        id={`cardClip-${teamId}`}
                        clipPathUnits="userSpaceOnUse"
                    >
                        <path d={CARD_BODY_PATH} />
                    </clipPath>
                </defs>

                {/* Base Card Fills (Dark & Light) */}
                <path
                    d={CARD_BODY_PATH}
                    fill={`url(#cardBaseDark-${teamId})`}
                    className={classes.darkOnlyFill}
                />
                <path
                    d={CARD_BODY_PATH}
                    fill={`url(#cardBaseLight-${teamId})`}
                    className={classes.lightOnlyFill}
                />

                {/* Clipped Fluid Tone-on-Tone Depth Waves & Watermark */}
                <g clipPath={`url(#cardClip-${teamId})`}>
                    {/* Softened Organic Tone-on-Tone Depth Blobs */}
                    <g filter={`url(#softenGrad-${teamId})`}>
                        {/* Top-Right Highlight Glow */}
                        <path
                            d="M 140,-20 C 175,40 220,60 310,45 L 310,-20 Z"
                            fill="rgba(255, 255, 255, 0.15)"
                        />

                        {/* Mid-Tone Shadow Swell */}
                        <path
                            d="M -20,120 C 50,110 90,160 120,220 C 140,260 130,300 100,340 L -20,340 Z"
                            fill="rgba(0, 0, 0, 0.18)"
                        />

                        {/* Bottom-Right Deep Shadow Swell */}
                        <path
                            d="M -20,180 C 60,160 120,220 160,260 C 200,300 240,320 310,300 L 310,360 L -20,360 Z"
                            fill="rgba(0, 0, 0, 0.32)"
                        />
                    </g>

                    {/* Neutral Softball Seam Background Watermark (Crisp) */}
                    <g
                        className={classes.seamWatermark}
                        data-testid="softball-seam-watermark"
                    >
                        <path
                            d={SEAM_PATHS.spine}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.10)"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                        />
                        <path
                            d={SEAM_PATHS.stitches}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.16)"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </g>

                    {/* Gentle Satin Sheen Overlay */}
                    <path
                        d={CARD_BODY_PATH}
                        fill={`url(#sheenGrad-${teamId})`}
                    />
                </g>

                {/* Sculpted Card Perimeter Border */}
                <path
                    d={CARD_BODY_PATH}
                    fill="none"
                    stroke={`url(#strokeGrad-${teamId})`}
                    strokeWidth="1.5"
                    className={classes.cardPath}
                />

                {/* Aerodynamic Accent Rail along Scoop Connected to Bottom-Right Corner */}
                <path
                    d={ACCENT_RAIL_PATH}
                    fill="none"
                    stroke={`url(#accentRail-${teamId})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className={classes.accentSwoop}
                />
            </svg>

            {/* Team details centered in card */}
            <div className={classes.contentWrapper}>
                <VisuallyHidden>{team?.name}</VisuallyHidden>
                {prefix && (
                    <Text
                        size="0.82rem"
                        fw={700}
                        tt="uppercase"
                        c="rgba(255, 255, 255, 0.85)"
                        style={{ letterSpacing: "2px", lineHeight: 1.2 }}
                    >
                        {prefix.toUpperCase()}
                    </Text>
                )}
                <Text
                    size="1.85rem"
                    fw={900}
                    tt="uppercase"
                    c="white"
                    style={{
                        letterSpacing: "1.5px",
                        lineHeight: 1.1,
                        textShadow: "0 2px 16px rgba(0, 0, 0, 0.8)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {nickname.toUpperCase()}
                </Text>
            </div>
        </Box>
    );
}
