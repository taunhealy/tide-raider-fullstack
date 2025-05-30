import { client } from "@/app/lib/sanity";
import { notFound } from "next/navigation";
import Image from "next/image";
import BlogSidebar from "@/app/components/postsSidebars/BlogSidebar";
import { postQuery } from "@/app/lib/queries";
import TripDetails from "@/app/components/TripDetails";
import CustomPortableText from "@/app/components/PortableText";
import { urlForImage } from "@/app/lib/urlForImage";
import { getVideoId } from "@/app/lib/videoUtils";
import { SectionImage } from "@/app/types/blog";
import { PortableTextBlock } from "next-sanity";
import { MediaGrid } from "@/app/components/MediaGrid";
import { beachData } from "@/app/types/beaches";
import { formatCountryName } from "@/app/lib/formatters";

interface VideoItem {
  video: {
    videoType: "youtube" | "vimeo";
    videoUrl: string;
    title?: string;
    description?: string;
  };
  layout: "full" | "half";
}

// Helper function to get beach data by ID
const getBeachById = (beachId: string) => {
  return beachData.find((beach) => beach.id === beachId);
};

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  if (!params.slug) return notFound();

  let post;
  try {
    post = await client.fetch(
      postQuery,
      { slug: params.slug },
      { cache: "no-store" }
    );
  } catch (error) {
    return notFound();
  }

  if (!post) return notFound();

  const safePost = {
    ...post,
    publishedAt: post.publishedAt || new Date().toISOString(),
    description: post.description || "No description available",
    mainImage: post.mainImage || {
      asset: {
        url: "/images/placeholder.jpg",
      },
    },
    content: post.content || [],
  };

  const sortedWidgets = safePost.sidebarWidgets?.sort(
    (a: { order: number }, b: { order: number }) => a.order - b.order
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-[1200px]">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <main className="max-w-full lg:max-w-[720px]">
          <h1 className="font-primary text-[2rem] sm:text-[2.5rem] leading-[1.2] font-bold mb-4">
            {safePost.title}
          </h1>
          {safePost.countries && safePost.countries.length > 0 && (
            <span className="flex items-center font-medium text-sm text-gray-600 mb-2">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              {safePost.countries
                .map((country: any) => formatCountryName(country))
                .join(", ")}
            </span>
          )}

          {safePost.mainImage?.asset && (
            <div className="relative aspect-[16/9] mb-8 sm:mb-12">
              <Image
                src={
                  urlForImage(safePost.mainImage)?.url() ||
                  "/images/placeholder.jpg"
                }
                alt={safePost.title}
                fill
                priority
                className="object-cover rounded-lg"
              />
            </div>
          )}

          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none font-primary">
            {safePost.content && Array.isArray(safePost.content) ? (
              safePost.content.map(
                (
                  section: {
                    sectionHeading?: string;
                    content: PortableTextBlock[];
                    sectionImages?: SectionImage[];
                    videoLink?: string;
                    sectionVideos?: VideoItem[];
                  },
                  index: number
                ) => (
                  <div key={index} className="mt-6 sm:mt-8">
                    {section.sectionHeading && (
                      <h2 className="text-[1.5rem] sm:text-[1.875rem] leading-[1.3] font-bold mb-3 sm:mb-4">
                        {section.sectionHeading}
                      </h2>
                    )}

                    {/* Render each content block with appropriate component */}
                    {section.content &&
                      Array.isArray(section.content) &&
                      section.content.map((block: any, blockIndex: number) => {
                        // Handle Beach Media Grid blocks
                        if (
                          block._type === "beachMediaGrid" &&
                          block.beachReference?.beachId
                        ) {
                          const beach = getBeachById(
                            block.beachReference.beachId
                          );

                          if (!beach) {
                            return (
                              <div
                                key={blockIndex}
                                className="my-6 p-4 bg-gray-100 rounded-lg"
                              >
                                <p className="font-primary text-gray-500">
                                  Beach not found:{" "}
                                  {block.beachReference.beachName}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div key={blockIndex} className="my-6">
                              {block.title && (
                                <h3 className="font-primary text-xl font-semibold mb-2">
                                  {block.title}
                                </h3>
                              )}
                              {block.description && (
                                <p className="font-primary mb-4">
                                  {block.description}
                                </p>
                              )}
                              <MediaGrid beach={beach} videos={beach.videos} />
                            </div>
                          );
                        }

                        // For all other block types, use the CustomPortableText component
                        return (
                          <CustomPortableText
                            key={blockIndex}
                            value={[block]}
                          />
                        );
                      })}

                    {/* Simple Video Link */}
                    {section.videoLink && (
                      <div className="my-4 sm:my-6">
                        <div className="relative aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${getVideoId(section.videoLink)}`}
                            title="Video"
                            className="w-full h-full rounded-lg"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Structured Section Videos */}
                    {section.sectionVideos?.map(
                      (videoItem: VideoItem, videoIndex) => (
                        <div
                          key={videoIndex}
                          className={`my-4 sm:my-6 ${videoItem.layout === "half" ? "lg:w-1/2" : "w-full"}`}
                        >
                          <div className="relative aspect-video">
                            {videoItem.video?.videoUrl && (
                              <iframe
                                src={`https://www.youtube.com/embed/${getVideoId(videoItem.video.videoUrl)}`}
                                title={videoItem.video.title || "Video"}
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                          </div>
                          {videoItem.video?.title && (
                            <h4 className="font-primary text-lg font-medium mt-2">
                              {videoItem.video.title}
                            </h4>
                          )}
                          {videoItem.video?.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {videoItem.video.description}
                            </p>
                          )}
                        </div>
                      )
                    )}

                    {section.sectionImages &&
                      section.sectionImages.map((image, imgIndex) => (
                        <div key={imgIndex} className="my-4 sm:my-6">
                          <div className="relative aspect-[16/9]">
                            <Image
                              src={
                                urlForImage(image.uploadedImage)?.url() ||
                                "/images/placeholder.jpg"
                              }
                              alt={image.uploadedImage?.alt || ""}
                              fill
                              className="object-cover rounded-lg"
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
                            />
                          </div>
                          {image.uploadedImage?.caption && (
                            <p className="text-sm text-gray-500 mt-2 px-2">
                              {image.uploadedImage.caption}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )
              )
            ) : (
              <p className="text-gray-600">
                No content available for this post.
              </p>
            )}

            {safePost.trip && <TripDetails trip={safePost.trip} />}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="space-y-6 sm:space-y-8 lg:sticky lg:top-4 lg:self-start">
          <BlogSidebar posts={safePost.relatedPosts} widgets={sortedWidgets} />
        </aside>
      </div>
    </div>
  );
}
