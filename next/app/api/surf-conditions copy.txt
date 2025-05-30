import type { APIRoute } from "astro";
import axios from "axios";
import * as cheerio from "cheerio";

function degreesToCardinal(degrees: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round((degrees % 360) / 22.5);
  return directions[index % 16];
}

export const GET: APIRoute = async () => {
  try {
    console.log("Fetching new data from swell.co.za...");
    const response = await axios.get("https://swell.co.za/ct/simple");
    const html = response.data;
    const $ = cheerio.load(html);

    // Get wind direction
    const windDirection = $(
      'div[style*="display:block"][style*="width: 49px"][style*="background-color: white"]'
    )
      .first()
      .text()
      .trim();

    // Get wave height
    const waveHeight =
      parseFloat(
        $(
          'div[style*="background-color: rgb(174, 174, 174)"][style*="color: rgb(46, 46, 46)"]'
        )
          .eq(1)
          .text()
          .trim()
      ) || 0;

    // Get swell period
    const swellPeriod =
      parseFloat(
        $(
          'div[style*="background-color: rgb(255, 202, 0)"][style*="color: rgb(0, 0, 0)"]'
        )
          .eq(1)
          .text()
          .trim()
      ) || 0;

    // Get swell direction
    const swellDirectionSelector =
      'div[style*="display:block"][style*="width: 49px"][style*="height:20px"][style*="line-height:20px"][style*="text-align: center"][style*="float:left"][style*="background-color: rgb(255, 154, 0)"][style*="color: rgb(0,0,0)"]';
    const swellDirectionElement = $(swellDirectionSelector).first();
    const swellDirection = swellDirectionElement.text().trim().replace("°", "");
    const swellDirectionDegrees = parseInt(swellDirection) || 0;
    const swellDirectionCardinal = degreesToCardinal(swellDirectionDegrees);

    const data = {
      wind: {
        direction: windDirection || "Unknown",
        cardinalDirection: windDirection,
        speed: 0,
      },
      swell: {
        height: waveHeight,
        period: swellPeriod,
        direction: swellDirection || "Unknown",
        cardinalDirection: swellDirectionCardinal,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch surf conditions" }),
      { status: 500 }
    );
  }
};
