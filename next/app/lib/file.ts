// Maximum file size (30MB for images, 100MB for videos)
export const MAX_FILE_SIZE = 30 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB for videos

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

// Convert image to WebP format (returns a Promise<File>)
// This function converts any image format to WebP for better compression
export async function convertImageToWebP(file: File): Promise<File> {
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

      // Convert to WebP blob with quality adjustment
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to convert image to WebP"));
            return;
          }

          // Generate new filename with .webp extension
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${originalName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/webp",
        0.85 // Quality setting (0.85 = 85% quality - good balance for WebP)
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for conversion"));
    };

    img.src = URL.createObjectURL(file);
  });
}

// Compress image if needed (returns a Promise<File>)
// Now converts to WebP format for better compression
export async function compressImageIfNeeded(file: File): Promise<File> {
  // Always convert to WebP for better compression, regardless of size
  // This ensures consistent format and smaller file sizes
  return convertImageToWebP(file);
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

    let progressStallTimeout: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (progressStallTimeout) {
        clearTimeout(progressStallTimeout);
        progressStallTimeout = null;
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
        // Determine target fps based on video duration (earlier = faster compression)
        // Shorter videos can use higher fps, longer videos use lower fps for speed
        const duration = video.duration;
        const targetFps = duration > 60 ? 15 : 20; // Lower fps for longer videos

        // Calculate target dimensions (max 1080px width/height for faster compression)
        // Lower resolution = faster compression while still maintaining good quality
        let { videoWidth, videoHeight } = video;
        const maxDimension = 1080; // Reduced from 1280 for faster compression
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
        // Using adaptive fps based on video duration (calculated earlier)
        // Reduced from 30 fps to 15-20 fps for faster compression
        const stream = canvas.captureStream(targetFps);
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedCodec,
          videoBitsPerSecond: 1500000, // Reduced from 2 Mbps to 1.5 Mbps for faster compression
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
        // Note: duration is already available from earlier calculation
        let lastProgressTime = Date.now();
        let lastProgressValue = 0;
        const PROGRESS_STALL_TIMEOUT = 30000; // 30 seconds without progress = stuck

        // Frame skipping for faster compression
        // Only draw every Nth frame to speed up compression significantly
        let frameSkipCounter = 0;
        const frameSkipRate = targetFps <= 15 ? 1 : 2; // Skip every 2nd frame if fps > 15

        // Function to check if compression has stalled
        const checkProgressStall = () => {
          if (isResolved) return;

          const currentTime = Date.now();
          const currentProgress =
            duration > 0 && !isNaN(duration) && isFinite(duration)
              ? (video.currentTime / duration) * 100
              : 0;

          // Check if progress has stalled (no change in 30 seconds)
          if (
            Math.abs(currentProgress - lastProgressValue) < 1 &&
            currentTime - lastProgressTime > PROGRESS_STALL_TIMEOUT
          ) {
            if (isResolved) return;
            isResolved = true;
            cleanup();
            console.error(
              "[compressVideoIfNeeded] Video compression stalled - no progress detected"
            );
            reject(
              new Error(
                "Video compression appears to be stuck. The video may be too large or complex. " +
                  "Please try using a YouTube/Vimeo link instead, or compress the video using external tools."
              )
            );
            return;
          }

          // Update progress tracking
          if (Math.abs(currentProgress - lastProgressValue) >= 1) {
            lastProgressTime = currentTime;
            lastProgressValue = currentProgress;
          }

          // Schedule next check
          if (!isResolved && progressStallTimeout === null) {
            progressStallTimeout = setTimeout(checkProgressStall, 5000); // Check every 5 seconds
          }
        };

        const drawFrame = () => {
          if (isResolved || video.ended || !mediaRecorder) {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
            if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }
            if (progressStallTimeout) {
              clearTimeout(progressStallTimeout);
              progressStallTimeout = null;
            }
            return;
          }

          // Frame skipping for faster compression
          // Only draw every Nth frame (skip intermediate frames)
          // This significantly speeds up compression while maintaining acceptable quality
          frameSkipCounter++;
          if (frameSkipCounter % frameSkipRate === 0) {
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          }

          // Update progress (check every frame for smoother progress updates)
          if (
            onProgress &&
            duration > 0 &&
            !isNaN(duration) &&
            isFinite(duration)
          ) {
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

          // Start progress stall checking once video starts playing
          if (progressStallTimeout === null && !isResolved) {
            progressStallTimeout = setTimeout(checkProgressStall, 5000);
          }
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
        // Note: Browser autoplay policies may block this, but since the user
        // has already interacted with the page (file selection), it should work
        video.play().catch((error) => {
          // Check if it's an autoplay policy error
          const errorName =
            error?.name ||
            (error instanceof Error ? error.constructor.name : "");
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          if (
            errorName === "NotAllowedError" ||
            errorMessage.includes("user didn't interact") ||
            errorMessage.includes("autoplay") ||
            errorMessage.includes("play() failed")
          ) {
            // Autoplay blocked by browser policy - return original file as fallback
            // This can happen if the video element was created after the user interaction
            cleanup();
            console.warn(
              "[compressVideoIfNeeded] Autoplay blocked by browser policy, returning original file",
              { errorName, errorMessage }
            );
            resolve(file);
            return;
          }

          // Other playback errors
          cleanup();
          console.error("[compressVideoIfNeeded] Error playing video:", error);
          reject(new Error("Failed to play video for compression"));
        });

        // Set a timeout to prevent hanging - use longer timeout for large videos
        // Base timeout: duration * 6 (compression takes time) + 120 seconds buffer
        // Minimum 3 minutes, maximum 15 minutes
        // Compression can take 4-6x the video duration, so we use a more generous timeout
        const baseTimeout = Math.max(
          180000, // 3 minutes minimum
          Math.min(900000, duration * 6000 + 120000) // duration * 6 + 2 minutes buffer, max 15 minutes
        );

        console.log(
          `[compressVideoIfNeeded] Setting timeout: ${(baseTimeout / 1000).toFixed(0)}s for video duration: ${duration.toFixed(2)}s`
        );

        timeout = setTimeout(() => {
          if (isResolved) return;
          isResolved = true;
          cleanup();
          const timeoutMinutes = Math.ceil(baseTimeout / 60000);
          reject(
            new Error(
              `Video compression timed out after ${timeoutMinutes} minute${timeoutMinutes > 1 ? "s" : ""}. ` +
                `The video may be too large or complex. Please try using a YouTube/Vimeo link instead, or compress the video using external tools.`
            )
          );
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
