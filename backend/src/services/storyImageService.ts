import sharp from "sharp";
import { prisma } from "../lib/prisma";

interface BeachStoryData {
  name: string;
  location: string;
  waveType: string;
  score: number; // 0-10
  conditions: {
    windSpeed: number;
    swellHeight: number;
    swellPeriod: number;
  };
}

interface StoryConfig {
  regionName: string;
  regionId: string;
  date: Date;
  beaches: BeachStoryData[];
}

/**
 * Score to label — matches the app's rating language
 */
function scoreToLabel(score: number): string {
  if (score >= 9) return "FIRING";
  if (score >= 7) return "EPIC";
  if (score >= 5) return "GOOD";
  if (score >= 3) return "FAIR";
  return "FLAT";
}

/**
 * Score to colour — mirrors --color-ui-* tokens from globals.css
 * High: #60a5fa (--color-tertiary blue)
 * Mid:  #d6b588 (--color-badge golden)
 * Low:  #4b5563 (--color-text-secondary muted)
 */
function scoreToColour(score: number): string {
  if (score >= 7) return "#60a5fa"; // --color-tertiary
  if (score >= 4) return "#d6b588"; // --color-badge
  return "#4b5563";                 // muted
}

/**
 * Format wave type (BEACH_BREAK -> Beach Break)
 */
function formatWaveType(waveType: string): string {
  if (!waveType) return "Beach Break";
  return waveType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Truncate beach name if too long
 */
function truncate(str: string, maxLen = 24): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "..." : str;
}

/**
 * Fetch the top N beaches by score for a region today
 */
export async function getTopBeachesForStory(
  regionId: string,
  topN = 5
): Promise<StoryConfig | null> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const region = await prisma.region.findUnique({ where: { id: regionId } });
  if (!region) {
    console.error(`[StoryImage] Region not found: ${regionId}`);
    return null;
  }

  const scores = await prisma.beachDailyScore.findMany({
    where: { regionId, date: today },
    include: { beach: true },
    orderBy: { score: "desc" },
    take: topN,
  });

  if (scores.length === 0) {
    console.warn(`[StoryImage] No scores found for ${regionId} today`);
    return null;
  }

  return {
    regionName: region.name,
    regionId,
    date: today,
    beaches: scores.map((s) => ({
      name: s.beach.name,
      location: s.beach.location ?? "",
      waveType: s.beach.waveType ?? "",
      score: s.score,
      conditions: {
        windSpeed: (s.conditions as any)?.windSpeed ?? 0,
        swellHeight: (s.conditions as any)?.swellHeight ?? 0,
        swellPeriod: (s.conditions as any)?.swellPeriod ?? 0,
      },
    })),
  };
}

/**
 * Generate a 1080x1920 Instagram Story PNG buffer.
 *
 * Design matches app globals.css:
 *   - bg-brand-dark  -> gray-900 (#111827) with shimmer gradient
 *   - text-brand-gradient -> white to #60a5fa
 *   - Montserrat uppercase for headings
 *   - Inter for body text
 *   - #60a5fa blue / #d6b588 golden for scores
 *   - Cyan (#1cd9ff) glow border on cards (matches .bg-brand-dark border)
 */
export async function generateStoryImage(config: StoryConfig): Promise<Buffer> {
  const W = 1080;
  const H = 1920;

  const dateStr = config.date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Johannesburg",
  });

  // Build a beach card row for each beach
  const beachRows = config.beaches
    .map((beach, i) => {
      const colour = scoreToColour(beach.score);
      const label = scoreToLabel(beach.score);
      // Bar fills proportionally up to 640px max — leaves 200px clear for badge+score
      const barWidth = Math.round((beach.score / 10) * 640);
      // Cards: 5 rows × 190px each starting at y=700
      const yBase = 700 + i * 190;
      const borderColour = "rgba(255,255,255,0.07)";

      return `
        <rect x="40" y="${yBase}" width="1000" height="175" rx="14"
          fill="rgba(17,24,39,0.92)" stroke="${borderColour}" stroke-width="1.2"/>

        <!-- Rank -->
        <text x="96" y="${yBase + 100}" text-anchor="middle"
          fill="${colour}" font-size="26" font-weight="700"
          font-family="Montserrat, Arial, sans-serif">${String(i + 1).padStart(2, "0")}</text>
        <rect x="126" y="${yBase + 28}" width="1" height="118"
          fill="rgba(255,255,255,0.08)"/>

        <!-- Beach name -->
        <text x="152" y="${yBase + 62}" fill="white" font-size="36"
          font-weight="700" font-family="Montserrat, Arial, sans-serif"
          letter-spacing="-0.5">${truncate(beach.name, 20)}</text>

        <!-- Location — beneath name -->
        <text x="152" y="${yBase + 93}" fill="rgba(156,163,175,0.45)"
          font-size="22" font-family="Arial, sans-serif"
          letter-spacing="0.2">${truncate(beach.location, 14)} • ${truncate(config.regionName, 14)} • ${formatWaveType(beach.waveType)}</text>

        <!-- Conditions — right side of location row -->
        <text x="1000" y="${yBase + 93}" text-anchor="end"
          fill="rgba(156,163,175,0.7)" font-size="23"
          font-family="Arial, sans-serif">${beach.conditions.windSpeed}kts / ${beach.conditions.swellHeight.toFixed(1)}m / ${beach.conditions.swellPeriod}s</text>

        <!-- Bar track -->
        <rect x="152" y="${yBase + 132}" width="700" height="8" rx="4"
          fill="rgba(255,255,255,0.07)"/>
        <!-- Bar fill -->
        <rect x="152" y="${yBase + 132}" width="${barWidth}" height="8" rx="4"
          fill="${colour}"/>

        <!-- Score — hard right -->
        <text x="1000" y="${yBase + 155}" text-anchor="end"
          fill="${colour}" font-size="38" font-weight="900"
          font-family="Montserrat, Arial, sans-serif">${beach.score}/10</text>
      `;
    })
    .join("\n");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#111827"/>
      <stop offset="50%"  stop-color="#151c29"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <rect x="0" y="0" width="${W}" height="2" fill="rgba(255,255,255,0.05)"/>

  <text x="64" y="148" fill="url(#brandGrad)"
    font-size="64" font-weight="800"
    font-family="Montserrat, Arial, sans-serif"
    letter-spacing="1">Tide Raider</text>

  <rect x="64" y="168" width="220" height="3" rx="1.5" fill="#60a5fa"/>

  <text x="64" y="216" fill="rgba(156,163,175,0.5)"
    font-size="26" font-family="Arial, sans-serif"
    letter-spacing="1">tideraider.com</text>

  <text x="540" y="410" text-anchor="middle" fill="white"
    font-size="82" font-weight="800"
    font-family="Montserrat, Arial, sans-serif"
    letter-spacing="-1">${config.regionName}</text>

  <text x="540" y="480" text-anchor="middle"
    fill="rgba(156,163,175,0.6)"
    font-size="32" font-family="Arial, sans-serif"
    letter-spacing="0.5">${dateStr}</text>

  <rect x="48" y="542" width="984" height="1" fill="rgba(255,255,255,0.06)"/>

  <text x="64" y="630" fill="rgba(156,163,175,0.45)"
    font-size="24" font-weight="600"
    font-family="Montserrat, Arial, sans-serif"
    letter-spacing="4">Top Breaks Today</text>

  ${beachRows}

  <rect x="48" y="1842" width="984" height="1" fill="rgba(255,255,255,0.06)"/>

  <text x="540" y="1886" text-anchor="middle"
    fill="rgba(156,163,175,0.4)"
    font-size="24" font-family="Arial, sans-serif"
    letter-spacing="1">Swipe up for full forecast</text>

  <text x="540" y="1916" text-anchor="middle"
    fill="rgba(148,163,184,0.4)"
    font-size="22" font-weight="600"
    font-family="Montserrat, Arial, sans-serif"
    letter-spacing="1">@tideraider</text>
</svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
