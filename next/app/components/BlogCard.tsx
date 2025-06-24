"use client";

import { urlForImage } from "@/app/lib/urlForImage";
import Link from "next/link";
import ClientImage from "@/app/components/ClientImage";
import { formatCountryName } from "@/app/lib/formatters";

interface Category {
  title: string;
  slug: { current: string };
}

interface BlogCardProps {
  post: {
    _id?: string;
    title: string;
    slug: string | { current: string };
    mainImage: any;
    publishedAt?: string;
    description?: string;
    categories?: any[];
    hoverImage?: any;
    trip?: {
      country?: string;
      region?: string;
    };
    countries?: string[];
  };
  layout?: "horizontal" | "vertical";
}

export default function BlogCard({ post, layout = "vertical" }: BlogCardProps) {
  if (!post.slug) {
    return null;
  }

  return (
    <article
      className={`bg-white rounded-lg overflow-hidden transition-all duration-300 group ${
        layout === "horizontal" ? "flex" : ""
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`flex ${
          layout === "horizontal" ? "flex-row" : "flex-col"
        } hover:no-underline`}
      >
        <div
          className={`relative ${
            layout === "horizontal" ? "w-[140px] h-[140px]" : "w-full h-[410px]"
          } overflow-hidden`}
        >
          {post.mainImage?.asset && (
            <>
              <div className="w-full h-full absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-300 z-10" />
              {/* Display location badges from post.countries */}
              {post.countries && post.countries.length > 0 && (
                <div className="absolute top-4 right-4 flex flex-wrap gap-2 text-xs text-white z-20">
                  {post.countries.map((country, index) => (
                    <span
                      key={index}
                      className="font-primary bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm"
                    >
                      {formatCountryName(country)}
                    </span>
                  ))}
                </div>
              )}
              <ClientImage
                src={
                  urlForImage(post.mainImage)?.width(600)?.height(400)?.url() ??
                  ""
                }
                alt={post.title || "Blog post image"}
                className="w-full h-full object-cover transition-transform duration-300"
              />
            </>
          )}
        </div>

        <div className={`${layout === "horizontal" ? "flex-1" : ""} p-6`}>
          {post.categories && post.categories.length > 0 && (
            <div className="flex gap-2 mb-3">
              {post.categories
                .filter((category): category is Category => !!category?.slug)
                .map((category) => (
                  <span
                    key={category.title}
                    className="font-primary text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] px-3 py-1 rounded font-semibold uppercase"
                  >
                    {category.title}
                  </span>
                ))}
            </div>
          )}

          <h3 className="font-primary text-lg mb-2 font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
            {post.title}
          </h3>

          <div
            className={`${layout === "horizontal" && "hidden md:flex"} flex items-center text-[var(--color-text-secondary)] font-primary font-medium`}
          >
            Read More
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </Link>
    </article>
  );
}
