"use client";

import { client } from "@/app/lib/sanity";
import { urlForImage } from "@/app/lib/urlForImage";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { blogListingQuery } from "@/app/lib/queries";

export default function BlogSection() {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["blogSection"],
    queryFn: async () => {
      try {
        const data = await client.fetch(blogListingQuery);
        console.log("Fetched blog data:", data);
        if (data?.posts) {
          data.posts = data.posts.filter(
            (post: any) => post.hasSlug && post.slug
          );
        }
        return data;
      } catch (error) {
        console.error("Error fetching blog data:", error);
        return { posts: [] };
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const allCategories = data?.categories || [];

  const filteredPosts =
    data?.posts
      ?.filter(
        (post: any) =>
          (activeCategory === "All" ||
            post.categories?.some(
              (category: any) => category.title === activeCategory
            )) &&
          post.hasSlug &&
          post.slug
      )
      .sort((a: any, b: any) => {
        // Sort by _createdAt in descending order (newest first)
        return (
          new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
        );
      }) ?? [];

  console.log("Filtered posts:", filteredPosts);

  if (isLoading) return <BlogSkeleton />;

  if (!data?.posts || data.posts.length === 0) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h2>
            <p className="text-lg text-gray-600">
              No posts available at the moment
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Our Blog
          </h2>

          <div className="flex justify-center gap-[16px] items-end overflow-x-auto overflow-y-hidden min-h-[32px] mt-8">
            {["All", ...allCategories.map((cat: any) => cat.title)].map(
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post: any) => {
            if (!post.slug) {
              console.warn("Post missing slug:", post);
              return null;
            }
            return (
              <article
                key={post._id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex flex-col hover:no-underline"
                >
                  <div className="relative w-full h-[410px] overflow-hidden">
                    {post.mainImage && (
                      <>
                        <div className="w-full h-full absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-300 z-10" />
                        {post.trip &&
                          (post.trip.country || post.trip.region) && (
                            <div className="absolute top-4 right-4 flex gap-2 text-xs text-white z-20">
                              {post.trip.country && (
                                <span className="font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                  {post.trip.country}
                                </span>
                              )}
                            </div>
                          )}
                        <Image
                          src={
                            urlForImage(post.mainImage)?.url() ||
                            "/images/placeholder.jpg"
                          }
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300"
                        />
                      </>
                    )}
                  </div>

                  <div className="p-6">
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {post.categories.map((category: any) => (
                          <span
                            key={category._id}
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

                    <div className="flex items-center text-[var(--color-text-secondary)] font-primary font-medium">
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
          })}
        </div>
      </div>
    </section>
  );
}

const BlogSkeleton = () => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="mb-12 text-center">
        <div className="h-12 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg">
            <div className="aspect-[16/9] bg-gray-200 animate-pulse"></div>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
