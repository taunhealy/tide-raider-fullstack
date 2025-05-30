import { PortableText, PortableTextComponents } from "@portabletext/react";
import { SectionImage } from "@/app/types/blog";
import { PortableTextBlock } from "@portabletext/types";
import { getVideoId } from "@/app/lib/videoUtils";
import Image from "next/image";
import { urlForImage } from "@/app/lib/urlForImage";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-2">{children}</p>,
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mb-6">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mb-5">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-[18px] font-semibold mb-2">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 mb-4 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    brandColor1: ({ children }) => (
      <span className="text-brand-1">{children}</span>
    ),
    brandColor2: ({ children }) => (
      <span className="text-brand-2">{children}</span>
    ),
    brandColor3: ({ children }) => (
      <span className="text-brand-3">{children}</span>
    ),
    link: ({ value, children }) => (
      <a href={value.href} className="text-brand-3 hover:underline">
        {children}
      </a>
    ),
    inlineH3: ({ children }) => (
      <span className="text-[18px] font-primary font-semibold mt-6 mb-2 block">
        {children}
      </span>
    ),
  },
  types: {
    section: ({
      value,
    }: {
      value: {
        content: PortableTextBlock[];
        sectionImages?: SectionImage[];
        videoLink?: string;
        sectionHeading?: string;
      };
    }) => {
      const { content, sectionImages, videoLink, sectionHeading } = value;
      const videoId = videoLink ? getVideoId(videoLink) : null;

      return (
        <div className="mb-8">
          {sectionHeading && (
            <h2 className="text-[1.875rem] leading-[1.3] font-bold mb-4">
              {sectionHeading}
            </h2>
          )}
          <PortableText value={content} components={components} />
          {videoId && (
            <div className="my-6">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube Video"
                className="w-full h-64"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {sectionImages && sectionImages.length > 0 && (
            <div
              className={`grid gap-6 my-12 ${
                sectionImages.length === 1
                  ? "grid-cols-1"
                  : sectionImages.length === 2
                    ? "grid-cols-2"
                    : sectionImages.length === 3
                      ? "grid-cols-3"
                      : "grid-cols-2 md:grid-cols-4"
              }`}
            >
              {sectionImages.map((image: SectionImage, index: number) => {
                const alt =
                  image.source === "upload"
                    ? image.uploadedImage?.alt || ""
                    : image.unsplashImage?.alt || "";

                if (image.source === "upload") {
                  const imageUrl = urlForImage(
                    image.uploadedImage?.asset
                  )?.url();

                  return (
                    <div
                      key={index}
                      className={`relative ${
                        image.layout === "full"
                          ? "col-span-full"
                          : image.layout === "half"
                            ? "col-span-2"
                            : "col-span-1"
                      }`}
                    >
                      <div className="relative aspect-[16/9]">
                        <Image
                          src={
                            image.uploadedImage?.asset?.url ||
                            "/images/placeholder.jpg"
                          }
                          alt={alt}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      {image.uploadedImage?.caption && (
                        <p className="text-sm text-gray-500 mt-2">
                          {image.uploadedImage.caption}
                        </p>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={index}
                      className={`relative ${
                        image.layout === "full"
                          ? "col-span-full"
                          : image.layout === "half"
                            ? "col-span-2"
                            : "col-span-1"
                      }`}
                    >
                      <div className="relative aspect-[16/9]">
                        <Image
                          src={
                            image.unsplashImage?.url ||
                            "/images/placeholder.jpg"
                          }
                          alt={image.unsplashImage?.alt || ""}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      );
    },
    youtube: ({ value }) => {
      const videoId = value?.url && getVideoId(value.url);
      if (!videoId) return null;

      return (
        <div className="my-6">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube Video"
            className="w-full h-64"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    },
    colorPicker: ({ value }) => (
      <div style={{ backgroundColor: value?.color?.hex, padding: "1rem" }}>
        Selected Color: {value?.color?.hex}
      </div>
    ),
  },
};

export default function CustomPortableText({
  value,
}: {
  value: PortableTextBlock[];
}) {
  return <PortableText value={value} components={components} />;
}
