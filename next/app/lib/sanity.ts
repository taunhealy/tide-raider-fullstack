import { createClient } from "next-sanity";

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  throw new Error(
    "NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is not set"
  );
}

if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
  throw new Error("NEXT_PUBLIC_SANITY_DATASET environment variable is not set");
}

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-12",
  useCdn: true,
  perspective: "published",
  stega: {
    enabled: false,
  },
  token: process.env.SANITY_API_TOKEN,
});

export async function sanityQuery<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("Sanity query error:", error);
    throw new Error("Failed to fetch data from Sanity");
  }
}
