import HeroSection from "./sections/Hero";
import { client } from "./lib/sanity";
import { homePageQuery } from "./lib/queries";

export const revalidate = 0;

export default async function HomePage() {
  try {
    const content = await client.fetch(homePageQuery);

    if (!content) {
      console.error("No content returned from Sanity");
      return (
        <div className="font-primary p-8 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-[var(--color-tertiary)]/30 border-t-[var(--color-tertiary)] rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 animate-pulse">
              Loading hero content...
            </p>
          </div>
        </div>
      );
    }

    return (
      <main>
        <HeroSection data={content} />
      </main>
    );
  } catch (error) {
    console.error("Error fetching homepage content:", error);
    return (
      <div className="font-primary p-8 text-center">
        <p>Error loading content. Please try again later.</p>
      </div>
    );
  }
}
