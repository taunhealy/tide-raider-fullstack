import { urlForImage } from "@/app/lib/urlForImage";
import Image from "next/image";
import { SanityImage } from "../types";

interface HeroFooterImageProps {
  data: {
    heroHeading?: string;
    heroSubheading?: string;
    heroFooterImage: SanityImage;
    overlayText?: string;
  };
}

export default function HeroImage({ data }: HeroFooterImageProps) {
  if (!data) return null;

  const imageUrl =
    data && data.heroFooterImage && data.heroFooterImage.asset
      ? urlForImage(data.heroFooterImage as SanityImage)
          .width(2400)
          .height(1350)
          .fit("min")
          .crop("focalpoint")
          .focalPoint(
            data.heroFooterImage?.hotspot?.x ?? 0.5,
            data.heroFooterImage?.hotspot?.y ?? 0.5
          )
          .auto("format")
          .quality(80)
          .url()
      : null;

  console.log("Image URL:", imageUrl); // Debug log

  return (
    <div className="relative w-full h-[56.25vw] max-h-[100svh] p-4 sm:p-6 md:p-8 lg:p-12 bg-gray-200">
      <div className="relative w-full h-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={data.heroFooterImage?.alt || "Hero image"}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <p className="text-white font-primary">Image not available</p>
          </div>
        )}

        {data.overlayText && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <h1 className="font-secondary text-white text-4xl sm:text-6xl md:text-[81px] lg:text-[120px] xl:text-[156px] leading-tight uppercase text-center break-words max-w-[90vw]">
              {data.overlayText}
            </h1>
          </div>
        )}
      </div>
    </div>
  );
}
