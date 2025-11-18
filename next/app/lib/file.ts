// Maximum file size (5MB for images, 20MB for videos)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB for videos

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
  DURATION: `Video duration must be ${MAX_VIDEO_DURATION} seconds or less`,
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

// Validate video file (size and duration)
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

  // Check video duration
  try {
    const duration = await getVideoDuration(file);
    console.log("[validateVideoFile] Video duration check:", {
      duration,
      maxDuration: MAX_VIDEO_DURATION,
      isValid: duration <= MAX_VIDEO_DURATION,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    
    // Use a small tolerance for floating point comparison (0.1 seconds)
    if (duration > MAX_VIDEO_DURATION + 0.1) {
      return {
        valid: false,
        error: `Video duration is ${duration.toFixed(1)} seconds. Maximum allowed is ${MAX_VIDEO_DURATION} seconds.`,
      };
    }
  } catch (error) {
    console.error("[validateVideoFile] Error reading video duration:", error);
    return {
      valid: false,
      error: `Failed to read video duration: ${error instanceof Error ? error.message : "Unknown error"}. Please try another video.`,
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
      const errorMessage = video.error?.message || "Failed to load video metadata";
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
