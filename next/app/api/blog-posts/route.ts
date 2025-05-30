import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { HARDCODED_COUNTRIES } from "@/app/lib/location/countries/constants";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2023-05-03",
  useCdn: false,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const continent = searchParams.get("continent");


    // Build Sanity query based on parameters
    let query = `*[_type == "post"]`;
    const params: Record<string, any> = {};

    if (country) {
      // Find the country ID from our shared library
      // First try to match by name
      let countryId = country.toLowerCase();

      // Check if this is a display name and find the corresponding ID
      const countryData = HARDCODED_COUNTRIES.find(
        (c) => c.name.toLowerCase() === country.toLowerCase()
      );

      if (countryData) {
        countryId = countryData.id;
      }

      console.log(`Using country ID: ${countryId}`);

      // Query posts that have this country ID in their countries array
      query = `*[_type == "post" && $country in countries[]]`;
      params.country = countryId;
    } else if (continent) {
      // For continent, use our shared library to get countries in that continent
      const countriesInContinent = HARDCODED_COUNTRIES.filter(
        (c) => c.continent === continent
      ).map((c) => c.id);

      console.log(`Countries in ${continent}:`, countriesInContinent);

      if (countriesInContinent.length > 0) {
        // Check if any of these country IDs are in the post's countries array
        query = `*[_type == "post" && array::containsAny(countries, $countriesInContinent)]`;
        params.countriesInContinent = countriesInContinent;
      }
    }

    // Add projection and sorting
    query += `{
      _id,
      title,
      slug {
        current
      },
      mainImage,
      description,
      publishedAt,
      trip,
      countries
    } | order(publishedAt desc)`;

    console.log("Executing Sanity query:", query);
    console.log("With params:", JSON.stringify(params));

    const posts = await client.fetch(query, params);
    console.log(
      `Found ${posts.length} posts:`,
      posts.map((p: any) => ({ title: p.title, countries: p.countries }))
    );

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts", details: error.message },
      { status: 500 }
    );
  }
}
