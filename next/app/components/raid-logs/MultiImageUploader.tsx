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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      alert(
        `You can only upload ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}`
      );
      return;
    }

    try {
      // Convert all images to WebP
      const convertedFiles = await Promise.all(
        files.map((file) => convertImageToWebP(file))
      );

      // Upload all images using server-side upload (avoids CORS issues)
      // The direct upload route has been fixed to work with R2 by removing ContentType
      const uploadPromises = convertedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "image");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error || errorData.message || "Failed to upload image";
          // Include details if available (for debugging)
          const fullError = errorData.details
            ? `${errorMessage} (${JSON.stringify(errorData.details)})`
            : errorMessage;
          throw new Error(fullError);
        }

        const data = await response.json();
        return data.imageUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert(error instanceof Error ? error.message : "Failed to upload images");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  return (
    <div className={cn("space-y-4 font-primary", className)}>
      {/* Upload button */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="multi-image-upload"
          />
          <label
            htmlFor="multi-image-upload"
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-[var(--color-tertiary)] hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 font-primary">
              Add Images ({images.length}/{maxImages})
            </span>
          </label>
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
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
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
