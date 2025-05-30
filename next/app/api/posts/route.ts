import { NextRequest, NextResponse } from "next/server";
import { client } from "@/app/lib/sanity";
import { blogSidebarQuery, postsByCategorySlugQuery } from "@/app/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let data;

    if (category) {
      // If category is provided, use the category-specific query
      data = await client.fetch(postsByCategorySlugQuery, {
        categorySlug: category,
      });
      console.log(`API Response for category '${category}':`, data);

      // Return the posts directly as an array
      return NextResponse.json(data);
    } else {
      // Otherwise, use the default blog sidebar query
      data = await client.fetch(blogSidebarQuery);
      console.log("API Response:", data);

      // Filter out posts without slugs
      if (data?.posts) {
        data.posts = data.posts.filter((post: any) => post.slug);
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
