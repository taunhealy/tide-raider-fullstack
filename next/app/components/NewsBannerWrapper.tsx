import { client } from "@/app/lib/sanity";
import NewsBanner from "./NewsBanner";

async function getBlogPosts() {
  return await client.fetch(`
    *[_type == "post"] | order(publishedAt desc)[0...10] {
      title,
      slug,
    }
  `);
}

export default async function NewsBannerWrapper() {
  const posts = await getBlogPosts();
  return <NewsBanner posts={posts} />;
}
