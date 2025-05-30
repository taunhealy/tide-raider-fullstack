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
  const scrollingPosts = [...posts, ...posts];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-tertiary)] z-50 flex h-10">
      {/* Left - Credit section - Hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0 bg-[var(--brand-tertiary)] px-3 sm:px-6 items-center border-r border-[var(--color-bg-tertiary)] rounded-md w-full md:w-auto justify-center md:justify-start">
        <span className="font-primary text-white text-sm">Latest Updates</span>
      </div>

      {/* Middle - Scrolling news section */}
      <div className="whitespace-nowrap overflow-hidden flex-grow h-full min-h-full flex items-center justify-center">
        <div className="inline-block w-full animate-scroll">
          {scrollingPosts.map((post, index) => (
            <a
              key={`${post.slug.current}-${index}`}
              href={`/blog/${post.slug.current}`}
              className="inline-block mx-4 sm:mx-8 text-sm sm:text-base text-white hover:text-gray-800 transition-colors pointer-events-auto font-primary"
            >
              {post.title}
              <span className="mx-2 sm:mx-4"></span>
            </a>
          ))}
        </div>
      </div>

      {/* Right - CTA section - Hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0 bg-white px-3 sm:px-6 py-[5px] items-center border-l border-[var(--color-bg-tertiary)] rounded-md">
        <a
          href="/pricing"
          className="text-black hover:text-gray-800 transition-colors text-xs sm:text-sm whitespace-nowrap"
        >
          {isMember ? "Ahoy!" : "Join now"}
        </a>
      </div>
    </div>
  );
}
