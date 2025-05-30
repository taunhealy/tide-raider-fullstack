"use client";

import { Post, Category } from "@/app/types/blog";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import BlogCard from "@/app/components/BlogCard";

interface Trip {
  title?: string;
  country?: string;
  region?: string;
  destination?: string;
}

// Extend the base Post type with any HeroBlog-specific fields
interface HeroPost
  extends Pick<
    Post,
    | "_id"
    | "title"
    | "slug"
    | "mainImage"
    | "publishedAt"
    | "description"
    | "categories"
    | "countries"
  > {
  hoverImage: any; // Additional field specific to HeroBlog
  trip?: Trip;
}

interface BlogData {
  categories: Category[];
  posts: Post[];
}

interface Props {
  data: BlogData | null;
}

export default function HeroBlogSection({ data }: Props) {
  if (!data) {
    return null;
  }

  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;
  const allCategories = data.categories || [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filteredPosts = useMemo(() => {
    return data.posts
      .filter((post) => {
        if (activeCategory === "All") return true;
        return post.categories?.some(
          (category) => category.title === activeCategory
        );
      })
      .sort((a, b) => {
        // Sort by creation date in descending order
        return (
          new Date(b._createdAt || "").getTime() -
          new Date(a._createdAt || "").getTime()
        );
      });
  }, [data.posts, activeCategory]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;

    const scrollAmount = containerRef.current.clientWidth;
    containerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();

      window.addEventListener("load", handleScroll);

      window.addEventListener("resize", handleScroll);
    }

    return () => {
      container?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("load", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, filteredPosts]);

  useEffect(() => {
    const cleanup = () => {
      const shareButtons = document.querySelectorAll(".share-button");
      shareButtons.forEach((button) => {
        button.replaceWith(button.cloneNode(true));
      });
    };

    return cleanup;
  }, []);

  return (
    <section className="blog-section pt-[54px] pb-[81px] md:pt-[54px] md:pb-[121.51px] px-4 md:px-[121.51px] bg-[var(--color-bg-primary)]">
      <div className="text-left mb-8 md:mb-12">
        <h3 className="heading-3 text-2xl md:text-3xl lg:text-4xl">
          Latest Blog Posts
        </h3>
      </div>
      <div className="blog-nav-container flex flex-col md:flex-row justify-between gap-[32px] mb-8">
        <div className="flex justify-between items-end w-full">
          <div className="blog-nav-titles flex flex-row gap-[16px] items-end overflow-x-auto overflow-y-hidden min-h-[32px] max-w-[calc(100%-100px)]">
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
          <div className="blog-nav-item flex-shrink-0 ml-4">
            <Link href="/blog">
              <span className="font-primary text-[16px] underline text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors duration-300">
                View All
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="blog-content-container px-4 md:px-[54px] relative">
        <div
          ref={containerRef}
          className="md:flex md:overflow-x-auto gap-4 md:gap-8 scroll-smooth no-scrollbar md:min-h-[540px] flex-col md:flex-row"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {filteredPosts.slice(0, 5).map((post: Post) => {
            if (!post.slug) {
              console.warn("Post missing slug:", post);
              return null;
            }
            return (
              <div
                key={post._id}
                className="flex-none w-full md:w-[calc(33.333%-1.33rem)] min-w-[280px] md:min-w-[300px] mb-4 md:mb-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <BlogCard
                  post={{
                    _id: post._id,
                    title: post.title || "",
                    slug:
                      typeof post.slug === "string"
                        ? post.slug
                        : post.slug?.current || "",
                    mainImage: post.mainImage,
                    publishedAt: post.publishedAt || undefined,
                    description: post.description || undefined,
                    categories: post.categories,
                    hoverImage: post.hoverImage,
                    trip: post.trip,
                    countries: post.countries,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="hidden md:block">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 ease-in-out ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={() => scroll("left")}
              className="bg-white rounded-full p-2 hover:bg-gray-50 transition-colors shadow-md"
            >
              <ChevronLeft size={24} />
            </button>
          </div>

          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 ease-in-out ${
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={() => scroll("right")}
              className="bg-white rounded-full p-2 hover:bg-gray-50 transition-colors shadow-md"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
