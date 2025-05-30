import Image from "next/image";

interface CloudflareImageProps {
  id: string;
  alt: string;
  className?: string;
}

export function CloudflareImage({
  id,
  alt,
  className = "",
}: CloudflareImageProps) {
  console.log("Rendering CloudflareImage with id:", id);

  if (!id) {
    console.warn("CloudflareImage received empty id");
    return <div className={`bg-gray-200 ${className}`}>No image</div>;
  }

  const imageUrl = `https://media.tideraider.com/${id}`;
  console.log("CloudflareImage URL:", imageUrl);

  return (
    <Image
      src={imageUrl}
      alt={alt || "Image"}
      fill
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
