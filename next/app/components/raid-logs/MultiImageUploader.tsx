"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, GripVertical, Plus } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { convertImageToWebP } from "@/app/lib/file";

interface MultiImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function MultiImageUploader({
  images = [],
  onImagesChange,
  maxImages = 10,
  className = "",
}: MultiImageUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Filter to only image files
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      alert("Please select image files only");
      return;
    }

    const remainingSlots = maxImages - images.length;
    if (imageFiles.length > remainingSlots) {
      alert(
        `You can only upload ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}`
      );
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatus("Converting images to WebP...");

      // Convert all images to WebP
      const convertedFiles = await Promise.all(
        imageFiles.map((file) => convertImageToWebP(file))
      );

      setUploadStatus(
        `Uploading ${convertedFiles.length} image${convertedFiles.length > 1 ? "s" : ""}...`
      );

      // Upload all images using XMLHttpRequest to track progress
      const uploadPromises = convertedFiles.map((file, index) => {
        return new Promise<string>((resolve, reject) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "image");

          const xhr = new XMLHttpRequest();

          // Track upload progress for this file
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              // Calculate overall progress: (completed files + current file progress) / total files
              const fileProgress = (e.loaded / e.total) * 100;
              const overallProgress =
                ((index + fileProgress / 100) / convertedFiles.length) * 100;
              setUploadProgress(Math.min(overallProgress, 99)); // Cap at 99% until all complete
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.imageUrl);
              } catch (error) {
                reject(new Error("Failed to parse response"));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                const errorMessage =
                  errorData.error ||
                  errorData.message ||
                  "Failed to upload image";
                reject(new Error(errorMessage));
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload was cancelled"));
          });

          xhr.open("POST", "/api/upload");
          xhr.withCredentials = true; // Include cookies for auth
          xhr.send(formData);
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setUploadProgress(100);
      setUploadStatus("Upload complete!");

      // Small delay to show 100% before clearing
      await new Promise((resolve) => setTimeout(resolve, 500));

      onImagesChange([...images, ...uploadedUrls]);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
    } catch (error) {
      console.error("Error uploading images:", error);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
      alert(error instanceof Error ? error.message : "Failed to upload images");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(dragOverIndex, 0, removed);
    onImagesChange(newImages);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  // Drag and drop handlers for file upload (from outside)
  const handleFileDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only show drag over state if dragging files (not images for reordering)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  };

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only show drag over state if dragging files (not images for reordering)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear drag over state if leaving the drop zone
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading || images.length >= maxImages) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  return (
    <div className={cn("space-y-4 font-primary", className)}>
      {/* Upload area with drag and drop */}
      {images.length < maxImages && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleFileDragEnter}
          onDragOver={handleFileDragOver}
          onDragLeave={handleFileDragLeave}
          onDrop={handleFileDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="multi-image-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="multi-image-upload"
            className={cn(
              "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
              isUploading
                ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                : isDragOver
                  ? "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/5 scale-[1.02]"
                  : "border-gray-300 hover:border-[var(--color-tertiary)] hover:bg-gray-50"
            )}
          >
            <Plus
              className={cn(
                "w-8 h-8 transition-colors",
                isDragOver ? "text-[var(--color-tertiary)]" : "text-gray-400"
              )}
            />
            <div className="text-center">
              <span
                className={cn(
                  "font-primary block",
                  isDragOver
                    ? "text-[var(--color-tertiary)] font-medium"
                    : "text-gray-600"
                )}
              >
                {isUploading
                  ? "Uploading..."
                  : isDragOver
                    ? "Drop images here"
                    : "Add images or drag and drop"}
              </span>
              <span className="text-xs text-gray-500 font-primary mt-1 block">
                {images.length} of {maxImages} images
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-primary">{uploadStatus}</span>
            <span className="text-gray-500 font-primary">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-[var(--color-tertiary)] h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={handleImageDrop}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index &&
                  "border-[var(--color-tertiary)] scale-105"
              )}
            >
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />

              {/* Drag handle */}
              <div className="absolute top-1 left-1 bg-black/50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                aria-label={`Remove image ${index + 1}`}
                title={`Remove image ${index + 1}`}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image number badge */}
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded font-primary">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-500 font-primary">
          Drag images to reorder • Click X to remove
        </p>
      )}
    </div>
  );
}
