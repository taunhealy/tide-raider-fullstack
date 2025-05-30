"use client";

import Image from "next/image";

export default function ClientImage({
  src,
  alt,
  className,
  onLoad,
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}) {
  return (
    <Image src={src} alt={alt} fill className={className} onLoad={onLoad} />
  );
}
