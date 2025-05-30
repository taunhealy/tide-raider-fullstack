// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

// Error messages
export const FILE_ERRORS = {
  SIZE: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
  TYPE: `File type must be one of: ${ALLOWED_FILE_TYPES.join(", ")}`,
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
