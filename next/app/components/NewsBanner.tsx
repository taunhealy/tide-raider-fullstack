"use client";

import React from "react";

interface Post {
  title: string;
  slug: {
    current: string;
  };
}

export default function NewsBanner({
  posts,
  isMember = false,
}: {
  posts: Post[];
  isMember?: boolean;
}) {
  // We still need to duplicate posts for seamless scrolling
  const scrollingPosts = posts && Array.isArray(posts) ? [...posts.filter(Boolean), ...posts.filter(Boolean)] : [];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#171c30] border-t border-[#60a5fa] z-50 flex h-10">
      {/* Left - Credit section - Hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0 bg-[#171c30] px-3 sm:px-6 items-center border-r border-[#60a5fa] w-full md:w-auto justify-center md:justify-start">
        <span className="font-primary text-[#60a5fa] text-sm font-bold tracking-wide">Latest Updates</span>
      </div>

      {/* Middle - Scrolling news section */}
      <div className="whitespace-nowrap overflow-hidden flex-grow h-full min-h-full flex items-center justify-center">
        <div className="inline-block w-full animate-scroll">
          {scrollingPosts.map((post, index) => {
            const slug = typeof post.slug === 'string' ? post.slug : post.slug?.current;
            if (!slug) return null;
            
            return (
              <a
                key={`${slug}-${index}`}
                href={`/blog/${slug}`}
                className="inline-block mx-4 sm:mx-8 text-sm sm:text-base text-[#60a5fa] hover:text-white transition-colors pointer-events-auto font-primary font-medium"
              >
                {post.title}
                <span className="mx-2 sm:mx-4"></span>
              </a>
            );
          })}
        </div>
      </div>

      </div>
  );
}
