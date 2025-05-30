"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/app/lib/sanity";
import type { CategoryListWidget } from "@/app/types/blog";

type CategoryListWidgetProps = Pick<
  CategoryListWidget,
  "title" | "displayStyle" | "showPostCount"
>;

type DisplayStyle = "list" | "grid" | "dropdown";

const containerStyles: Record<DisplayStyle, string> = {
  list: "space-y-2",
  grid: "grid grid-cols-2 gap-4",
  dropdown: "relative",
};

interface Category {
  title: string;
  slug: { current: string };
  postCount: number;
}

export default function CategoryListWidget({
  title,
  displayStyle = "list",
  showPostCount,
}: CategoryListWidgetProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const query = `
        *[_type == "postCategory"] {
          title,
          slug,
          "postCount": count(*[_type == "post" && references(^._id)])
        }
      `;
      return client.fetch<Category[]>(query);
    },
  });

  if (isLoading) return <div>Loading categories...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className={containerStyles[displayStyle as DisplayStyle]}>
        {categories?.map((category: Category) => (
          <Link
            key={category.slug.current}
            href={`/blog?category=${category.slug.current}`}
            className="flex items-center justify-between hover:text-[var(--color-tertiary)] transition-colors"
          >
            <span>{category.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
