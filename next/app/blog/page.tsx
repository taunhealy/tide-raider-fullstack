import { landingPageQuery } from "@/app/lib/queries";
import { client } from "@/app/lib/sanity";
import BlogGrid from "../sections/BlogGrid";
import { groq } from "next-sanity";

export const revalidate = 0;

// Only fetch content, not structure
async function getHomeContent() {
  const content = await client.fetch(landingPageQuery);

  return content
    ? {
        hero: {
          heroHeading: content.heroHeading,
          heroSubheading: content.heroSubheading,
          heroImage: content.heroImage,
          heroFooterImage: content.heroFooterImage,
        },
        blog: content.blog,
        image: content.heroImage,
      }
    : null;
}

const blogPageQuery = groq`{
  "blog": {
    "posts": *[_type == "post"] | order(_createdAt desc) {
      _id,
      title,
      "slug": slug.current,
      mainImage,
      publishedAt,
      description,
      categories[]->{
        _id,
        title,
        "slug": slug.current
      },
      "trip": trip->{
        country,
        region
      },
      countries
    },
    "allCategories": *[_type == "postCategory"] {
      _id,
      title,
      "slug": slug.current
    }
  }
}`;

export default async function BlogPage() {
  const content = await client.fetch(blogPageQuery);

  if (!content) {
    return (
      <div className="animate-pulse max-w-7xl mx-auto px-4">
        {/* Title Skeleton */}
        <div className="h-8 bg-gray-200 rounded-full w-48 mb-8 mx-auto"></div>

        {/* Blog Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              {/* Image placeholder */}
              <div className="h-48 bg-gray-200 w-full"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                <div className="h-3 bg-gray-200 rounded-full w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (content && content.blog) {
    const longboardingPost = {
      _id: "top-longboarding-spots-static",
      title: "The Glide: Top Longboarding Spots in the World",
      slug: "top-longboarding-spots",
      description: "Explore the most iconic longboarding surf spots across the globe, from the historic rollers of Waikiki to the endless lefts of Chicama.",
      publishedAt: new Date().toISOString(),
      mainImage: {
        asset: {
          _ref: "image-longboarding-hero",
          url: "/images/blog/longboarding-ghibli-thumbnail.png"
        }
      },
      categories: [
        { _id: "cat-travel", title: "Travel", slug: "travel" },
        { _id: "cat-guides", title: "Guides", slug: "guides" }
      ]
    };

    // Add to the beginning of the posts array
    content.blog.posts = [longboardingPost, ...(content.blog.posts || [])];
    
    // Ensure categories are updated too
    if (content.blog.allCategories) {
      if (!content.blog.allCategories.some((c: any) => c.title === "Guides")) {
        content.blog.allCategories.push({ _id: "cat-guides", title: "Guides", slug: "guides" });
      }
    }
  }

  return (
    <main className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <h1 className="font-primary text-4xl md:text-5xl font-bold text-left mb-12">
          Blog Posts
        </h1>
        <BlogGrid data={content.blog} />
      </div>
    </main>
  );
}
