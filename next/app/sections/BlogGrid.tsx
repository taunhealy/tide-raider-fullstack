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
  // Hooks must be called before any early returns
  const [activeCategory, setActiveCategory] = useState("All");
  const allCategories = data?.allCategories || [];
  const getCategoryCount = (category: string) => {
    if (!data) return 0;
    if (category === "All") return data.posts.length;
    return data.posts.filter((post) =>
      post.categories?.some((cat) => cat?.title === category)
    ).length;
  };

  const filteredPosts = useMemo(() => {
    if (!data) return [];
    return data.posts.filter((post) => {
      if (activeCategory === "All") return true;
      return post.categories?.some(
        (category) => category?.title === activeCategory
      );
    });
  }, [data, activeCategory]);

  if (!data) {
    return null;
  }

  return (
    <section className="blog-section pt-[32px] pb-[81px] md:pt-[32px] md:pb-[121.51px] px-4 md:px-[121.51px] bg-[var(--color-bg-primary)]">
      <div className="blog-nav-container flex flex-col md:flex-row justify-between gap-[32px] mb-8">
        <div className="flex justify-between items-end w-full">
          <div className="blog-nav-titles flex flex-row gap-[12px] items-center overflow-x-auto overflow-y-hidden py-2 min-h-[44px] max-w-full scrollbar-none">
            {["All", ...allCategories.map((cat) => cat.title)].map(
              (category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`inline-flex items-center gap-2.5 px-4 h-9 rounded-full border transition-all text-[11px] font-bold font-primary tracking-wider uppercase whitespace-nowrap active:scale-95 shadow-sm ${
                    activeCategory === category
                      ? "bg-[#171c30] border-[#60a5fa] text-[#60a5fa] shadow-md shadow-[#60a5fa]/10"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black ${
                      activeCategory === category
                        ? "bg-[#60a5fa] text-[#171c30]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {getCategoryCount(category)}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map((post: HeroPost) => {
          const slugValue =
            typeof post.slug === "string" ? post.slug : post.slug?.current;
          return (
            <BlogCard key={post._id || slugValue || post.title} post={post} />
          );
        })}
      </div>
    </section>
  );
}
