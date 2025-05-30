"use client";

import { useState, useMemo } from "react";
import BlogCard from "@/app/components/BlogCard";
import { Post as BasePost } from "@/app/types/blog";
import Link from "next/link";

interface Category {
  title: string;
  slug: { current: string };
}

interface HeroPost
  extends Pick<
    BasePost,
    "_id" | "title" | "slug" | "mainImage" | "description" | "categories"
  > {
  publishedAt?: string;
  hoverImage: any;
  trip?: {
    country?: string;
    region?: string;
  };
  countries?: string[];
}

interface BlogProps {
  data: {
    posts: HeroPost[];
    allCategories: Category[];
  } | null;
}

export default function BlogGrid({ data }: BlogProps) {
  if (!data) {
    return null;
  }

  const [activeCategory, setActiveCategory] = useState("All");
  const allCategories = data.allCategories || [];
  const layout = "vertical";

  const filteredPosts = useMemo(() => {
    return data.posts.filter((post) => {
      if (activeCategory === "All") return true;
      return post.categories?.some(
        (category) => category?.title === activeCategory
      );
    });
  }, [data.posts, activeCategory]);

  return (
    <section className="blog-section pt-[32px] pb-[81px] md:pt-[32px] md:pb-[121.51px] px-4 md:px-[121.51px] bg-[var(--color-bg-primary)]">
      <div className="blog-nav-container flex flex-col md:flex-row justify-between gap-[32px] mb-4">
        <div className="flex justify-between items-end w-full">
          <div className="blog-nav-titles flex flex-row gap-[16px] items-end overflow-x-auto overflow-y-hidden min-h-[32px] max-w-full">
            {["All", ...allCategories.map((cat) => cat.title)].map(
              (category) => (
                <h6
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`font-primary cursor-pointer whitespace-nowrap transition-all ease-in-out duration-300 ${
                    activeCategory === category
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span
                    className={`relative after:content-[""] after:absolute after:left-0 after:bottom-[-3px] after:h-[2px] after:bg-gray-900 after:transition-all after:duration-300 after:ease-out ${
                      activeCategory === category ? "after:w-full" : "after:w-0"
                    }`}
                  >
                    {category}
                  </span>
                </h6>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map((post: HeroPost) => (
          <Link
            key={post._id}
            href={`/blog/${typeof post.slug === "string" ? post.slug : post.slug.current}`}
            className="flex flex-col hover:no-underline"
          >
            <BlogCard post={post} />
          </Link>
        ))}
      </div>
    </section>
  );
}
