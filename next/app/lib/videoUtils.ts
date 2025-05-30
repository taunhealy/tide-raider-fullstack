/**
 * Extracts the video ID from a YouTube or Vimeo URL
 */
export function getVideoId(
  url: string,
  platform: "youtube" | "vimeo" = "youtube"
): string {
  if (!url) return "";

  if (platform === "youtube") {
    // Handle various YouTube URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  } else if (platform === "vimeo") {
    // Handle Vimeo URLs
    const regExp = /vimeo\.com\/([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : "";
  }

  return "";
}

/**
 * Generates a thumbnail URL for a video
 */
export function getVideoThumbnail(
  url: string,
  platform: "youtube" | "vimeo" = "youtube"
): string {
  const videoId = getVideoId(url, platform);

  if (!videoId) return "";

  if (platform === "youtube") {
    // YouTube thumbnail URL
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } else if (platform === "vimeo") {
    // For Vimeo, we'd need to use their API to get thumbnails
    // This is a placeholder - in production you'd want to fetch the actual thumbnail
    return `https://vumbnail.com/${videoId}.jpg`;
  }

  return "";
}
