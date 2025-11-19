// Maximum file size (5MB for images, 55MB for videos)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 55 * 1024 * 1024; // 55MB for videos

// Maximum video duration (60 seconds)
export const MAX_VIDEO_DURATION = 60; // seconds

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

// Allowed video types
export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
];

// Error messages
export const FILE_ERRORS = {
  SIZE: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
  VIDEO_SIZE: `Video size must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
  TYPE: `File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`,
  VIDEO_TYPE: `Video type must be one of: ${ALLOWED_VIDEO_TYPES.join(", ")}`,
  REQUIRED: "File is required",
} as const;

// Validation function
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: FILE_ERRORS.REQUIRED };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: FILE_ERRORS.SIZE };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: FILE_ERRORS.TYPE };
  }

  return { valid: true };
}

// Generate a unique filename with timestamp
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop();
  const sanitizedName = originalName
    .split(".")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-");

  return `${sanitizedName}-${timestamp}.${extension}`;
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Get file extension from mime type
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };

  return mimeToExt[mimeType] || "";
}

// Validate video file (size only)
export async function validateVideoFile(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: FILE_ERRORS.REQUIRED };
  }

  // Check file type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { valid: false, error: FILE_ERRORS.VIDEO_TYPE };
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: FILE_ERRORS.VIDEO_SIZE,
    };
  }

  return { valid: true };
}

// Get video duration in seconds
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error("Timeout while reading video metadata"));
    }, 10000); // 10 second timeout

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = video.duration;
      console.log("[getVideoDuration] Video metadata loaded:", {
        duration,
        isNaN: isNaN(duration),
        isFinite: isFinite(duration),
        fileName: file.name,
      });

      // Check if duration is valid
      if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
        window.URL.revokeObjectURL(video.src);
        reject(new Error(`Invalid video duration: ${duration}`));
        return;
      }

      window.URL.revokeObjectURL(video.src);
      resolve(duration);
    };

    video.onerror = (e) => {
      clearTimeout(timeout);
      window.URL.revokeObjectURL(video.src);
      const errorMessage =
        video.error?.message || "Failed to load video metadata";
      console.error("[getVideoDuration] Video error:", {
        error: errorMessage,
        errorCode: video.error?.code,
        fileName: file.name,
      });
      reject(new Error(errorMessage));
    };

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
  });
}

// Compress image if needed (returns a Promise<File>)
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= MAX_FILE_SIZE) {
    return file;
  }

  // Use browser's built-in compression via canvas
  const img = new Image();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      const maxDimension = 1920; // Max width/height

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob with quality adjustment
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/jpeg",
        0.8 // Quality setting (0.8 = 80% quality)
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    img.src = URL.createObjectURL(file);
  });
}

// Threshold for when compression is required (4.5MB - Vercel/Next.js body size limit)
const COMPRESSION_THRESHOLD = 4.5 * 1024 * 1024;

// Compress video if needed (returns a Promise<File>)
// This function attempts to compress videos over 4.5MB to fit within Vercel/Next.js API route body size limits
// Note: Client-side video compression is limited. For best results, users should compress videos
// before uploading or use YouTube/Vimeo links for large videos.
export async function compressVideoIfNeeded(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  // Only compress if file is over the threshold (required for Vercel's 4.5MB body limit)
  if (file.size <= COMPRESSION_THRESHOLD) {
    return file;
  }

  // Check if MediaRecorder is available
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) {
    console.warn(
      "[compressVideoIfNeeded] MediaRecorder not available, returning original file"
    );
    return file;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true; // Required for autoplay in most browsers
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);

    let mediaRecorder: MediaRecorder | null = null;
    const chunks: Blob[] = [];
    let isResolved = false; // Flag to prevent multiple resolve/reject calls
    let animationFrameId: number | null = null;
    let timeout: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      URL.revokeObjectURL(objectUrl);
      if (video.src) {
        video.src = "";
      }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        try {
          mediaRecorder.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      // Remove all event listeners to prevent infinite loops
      video.onloadedmetadata = null;
      video.onerror = null;
      video.onplay = null;
      video.onended = null;
    };

    video.onloadedmetadata = async () => {
      if (isResolved) return; // Prevent multiple calls
      try {
        // Calculate target dimensions (max 1280px width/height to reduce file size)
        let { videoWidth, videoHeight } = video;
        const maxDimension = 1280;
        let targetWidth = videoWidth;
        let targetHeight = videoHeight;

        if (videoWidth > maxDimension || videoHeight > maxDimension) {
          if (videoWidth > videoHeight) {
            targetWidth = maxDimension;
            targetHeight = Math.round(
              (videoHeight / videoWidth) * maxDimension
            );
          } else {
            targetHeight = maxDimension;
            targetWidth = Math.round((videoWidth / videoHeight) * maxDimension);
          }
        }

        // Create canvas for video processing
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: false });

        if (!ctx) {
          cleanup();
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Find a supported codec
        const codecs = [
          "video/webm;codecs=vp9",
          "video/webm;codecs=vp8",
          "video/webm",
        ];

        let selectedCodec = "";
        for (const codec of codecs) {
          if (MediaRecorder.isTypeSupported(codec)) {
            selectedCodec = codec;
            break;
          }
        }

        if (!selectedCodec) {
          cleanup();
          console.warn(
            "[compressVideoIfNeeded] No supported codec found, returning original file"
          );
          resolve(file);
          return;
        }

        // Create a stream from the canvas
        const stream = canvas.captureStream(30); // 30 fps
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedCodec,
          videoBitsPerSecond: 2000000, // 2 Mbps - lower bitrate for smaller files
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          const blob = new Blob(chunks, { type: selectedCodec.split(";")[0] });
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".webm"),
            {
              type: selectedCodec.split(";")[0],
              lastModified: Date.now(),
            }
          );

          // Check if compression actually reduced size
          if (compressedFile.size < file.size && compressedFile.size > 0) {
            console.log(
              `[compressVideoIfNeeded] Compression successful: ${(file.size / (1024 * 1024)).toFixed(2)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`
            );
            resolve(compressedFile);
          } else {
            console.warn(
              "[compressVideoIfNeeded] Compression did not reduce size or resulted in empty file, returning original"
            );
            resolve(file);
          }
        };

        mediaRecorder.onerror = (event) => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          console.error("[compressVideoIfNeeded] MediaRecorder error:", event);
          reject(new Error("Video compression failed"));
        };

        // Draw video frames to canvas and record
        const duration = video.duration;

        const drawFrame = () => {
          if (isResolved || video.ended || !mediaRecorder) {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
            if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }
            return;
          }

          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

          // Update progress
          if (onProgress && duration > 0) {
            const progress = (video.currentTime / duration) * 100;
            onProgress(Math.min(progress, 100));
          }

          animationFrameId = requestAnimationFrame(drawFrame);
        };

        video.onplay = () => {
          if (isResolved) return;
          if (mediaRecorder && mediaRecorder.state === "inactive") {
            mediaRecorder.start(100); // Collect data every 100ms
          }
          animationFrameId = requestAnimationFrame(drawFrame);
        };

        video.onended = () => {
          if (isResolved) return;
          if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        };

        // Set video dimensions and start
        video.width = targetWidth;
        video.height = targetHeight;
        video.currentTime = 0;

        // Start playing (muted for autoplay)
        video.play().catch((error) => {
          cleanup();
          console.error("[compressVideoIfNeeded] Error playing video:", error);
          reject(new Error("Failed to play video for compression"));
        });

        // Set a timeout to prevent hanging - use longer timeout for large videos
        // Base timeout: duration * 3 (compression takes time) + 60 seconds buffer
        // Minimum 2 minutes, maximum 10 minutes
        const baseTimeout = Math.max(
          120000,
          Math.min(600000, duration * 3000 + 60000)
        );
        timeout = setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          reject(new Error("Video compression timed out"));
        }, baseTimeout);
      } catch (error) {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        console.error(
          "[compressVideoIfNeeded] Error setting up compression:",
          error
        );
        reject(
          new Error(
            `Video compression failed: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    };

    video.onerror = (e) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      const errorMessage =
        video.error?.message || "Failed to load video for compression";
      console.error("[compressVideoIfNeeded] Video load error:", errorMessage);
      reject(new Error(errorMessage));
    };

    video.src = objectUrl;
  });
}
