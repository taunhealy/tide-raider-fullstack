/**
 * Detects the platform and extracts the video ID from a URL
 */
export function parseVideoUrl(url: string): {
  id: string;
  platform: "youtube" | "vimeo" | "short" | "upload" | "instagram" | null;
} {
  if (!url) return { id: "", platform: null };

  // Check for YouTube Shorts first
  if (url.includes("youtube.com/shorts/")) {
    const parts = url.split("/shorts/");
    const id = parts[1]?.split(/[?&]/)[0] || "";
    return { id, platform: "short" };
  }

  // Regular YouTube
  const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const youtubeMatch = url.match(youtubeRegExp);
  if (youtubeMatch && youtubeMatch[2].length === 11) {
    return { id: youtubeMatch[2], platform: "youtube" };
  }

  // Vimeo
  const vimeoRegExp = /vimeo\.com\/([0-9]+)/;
  const vimeoMatch = url.match(vimeoRegExp);
  if (vimeoMatch) {
    return { id: vimeoMatch[1], platform: "vimeo" };
  }

  if (url.includes("r2.tideraider.com") || url.match(/\.(mp4|webm|mov|avi)$/i)) {
    return { id: url, platform: "upload" };
  }

  // Instagram
  if (url.includes("instagram.com/p/") || url.includes("instagram.com/reels/") || url.includes("instagram.com/reel/")) {
    const parts = url.split(/\/p\/|\/reels\/|\/reel\//);
    const id = parts[1]?.split("/")[0] || "";
    return { id, platform: "instagram" };
  }

  return { id: "", platform: null };
}

/**
 * Extracts the video ID from a YouTube or Vimeo URL
 */
export function getVideoId(
  url: string,
  platform: "youtube" | "vimeo" | "short" | "upload" | "instagram" = "youtube"
): string {
  const result = parseVideoUrl(url);
  if (result.platform === platform || (platform === "youtube" && result.platform === "short")) {
    return result.id;
  }
  return "";
}

/**
 * Generates a thumbnail URL for a video
 */
export function getVideoThumbnail(
  url: string,
  platform?: "youtube" | "vimeo" | "short" | "upload" | "instagram"
): string {
  if (!url) return "/images/placeholder.jpg";

  const { id, platform: detectedPlatform } = parseVideoUrl(url);
  const finalPlatform = platform || detectedPlatform;

  if (!id && finalPlatform !== "upload") {
    return "/images/placeholder.jpg";
  }

  if (finalPlatform === "youtube" || finalPlatform === "short") {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  } else if (finalPlatform === "vimeo") {
    return `https://vumbnail.com/${id}.jpg`;
  } else if (finalPlatform === "upload") {
    // For uploaded videos, we might show a video icon or a generic thumbnail
    return "/images/video-placeholder.jpg";
  } else if (finalPlatform === "instagram") {
    // Instagram doesn't provide a direct thumbnail URL easily without API, 
    // but we can use a generic icon or eventually scrape it.
    return "/images/instagram-placeholder.png";
  }

  return "/images/placeholder.jpg";
}

/**
 * Formats a video URL for embedding
 */
export function getEmbedUrl(url: string): string {
  const { id, platform } = parseVideoUrl(url);
  
  if (platform === "youtube") {
    return `https://www.youtube.com/embed/${id}`;
  } else if (platform === "short") {
    return `https://www.youtube.com/embed/${id}`;
  } else if (platform === "vimeo") {
    return `https://player.vimeo.com/video/${id}`;
  } else if (platform === "instagram") {
    return `https://www.instagram.com/p/${id}/embed`;
  }
  
  return url;
}
