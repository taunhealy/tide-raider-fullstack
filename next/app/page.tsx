import { client } from "./lib/sanity";
import { landingPageQuery } from "./lib/queries";
import HeroBlogSection from "./sections/HeroBlog";
import HeroSection from "./sections/Hero";
import HeroImage from "./sections/HeroImage";
import About from "./sections/About";
import HeroProduct from "./sections/HeroProduct";

export const revalidate = 0;

export default async function HomePage() {
  const content = await client.fetch(landingPageQuery);

  if (!content) return <div className="font-primary">Loading...</div>;

  return (
    <main>
      <HeroSection data={content.hero} />
      <About data={content.about} />
      <HeroProduct data={content.heroProduct} />
      <HeroBlogSection data={content.blog} />
      <HeroImage data={content.heroImage} />
    </main>
  );
}
