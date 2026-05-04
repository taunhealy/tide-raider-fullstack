import { client } from "@/app/lib/sanity";
import NewsBanner from "./NewsBanner";

async function getBlogPosts() {
  try {
    return await client.fetch(`
      *[_type == "post"] | order(publishedAt desc)[0...10] {
        title,
        slug,
      }
    `);
  } catch (error) {
    console.error("[NewsBannerWrapper] Failed to fetch blog posts:", error);
    return [];
  }
}

export default async function NewsBannerWrapper() {
  const posts = await getBlogPosts();
  return <NewsBanner posts={posts} />;
}
