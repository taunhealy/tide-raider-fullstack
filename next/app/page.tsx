import { client } from "./lib/sanity";
import { homePageQuery } from "./lib/queries";
import HeroBlogSection from "./sections/HeroBlog";
import HeroSection from "./sections/Hero";
import HeroImage from "./sections/HeroImage";
import About from "./sections/About";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

export const revalidate = 0;

export default async function HomePage() {
  try {
    const content = await client.fetch(homePageQuery);

    if (!content) {
      console.error("No content returned from Sanity");
      return (
        <div className="font-primary">
          <LoadingSpinner />
        </div>
      );
    }

    console.log("Hero content:", content?.hero);

    return (
      <main>
        <HeroSection data={content.hero} />
        <About data={content.about} />
        <HeroBlogSection data={content.blog} />
        <HeroImage data={content.heroImage} />
      </main>
    );
  } catch (error) {
    console.error("Error fetching homepage content:", error);
    return (
      <div className="font-primary">
        <p>Error loading content. Please try again later.</p>
      </div>
    );
  }
}
