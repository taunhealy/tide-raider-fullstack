"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { XMarkIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

import { getBackendUrl } from "@/app/lib/api-config";

interface VideoUploaderProps {
  videos: { url: string; title: string; platform: string }[];
  setVideos: (videos: { url: string; title: string; platform: string }[]) => void;
  maxVideos?: number;
}

export function VideoUploader({
  videos = [],
  setVideos,
  maxVideos = 1,
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (files: File[]) => {
    if (videos.length + files.length > maxVideos) {
      setError(`You can only upload a maximum of ${maxVideos} videos`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "video");

        const response = await fetch(`${getBackendUrl()}/api/upload`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to upload video");
        }

        const data = await response.json();
        return {
          url: data.videoUrl, // Endpoint returns { videoUrl: ... }
          title: file.name.replace(/\.[^/.]+$/, ""), // Default title from filename
          platform: "native",
        };
      });

      const uploadedVideos = await Promise.all(uploadPromises);
      setVideos([...videos, ...uploadedVideos]);
    } catch (err: any) {
      console.error("Error uploading videos:", err);
      setError(err.message || "Failed to upload videos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/*": [".mp4", ".webm", ".mov", ".avi"],
    },
    onDrop: handleUpload,
    disabled: uploading || videos.length >= maxVideos,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeVideo = (index: number) => {
    const newVideos = [...videos];
    newVideos.splice(index, 1);
    setVideos(newVideos);
  };

  return (
    <div className="space-y-4 font-primary">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10"
            : "border-gray-300 dark:border-gray-600 hover:border-purple-400"
        } ${uploading || videos.length >= maxVideos ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-gray-500 dark:text-gray-400">Uploading video...</p>
        ) : videos.length >= maxVideos ? (
          <p className="text-gray-500 dark:text-gray-400">Maximum number of videos reached</p>
        ) : (
          <div>
            <VideoCameraIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Drag & drop a video here, or click to select
            </p>
            <p className="text-xs text-gray-400 mt-1">
              MP4, WebM up to 100MB. For hover previews.
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {videos.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {videos.map((video, index) => (
            <div key={index} className="relative group bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden p-2 flex items-center gap-3">
              <div className="w-20 h-16 bg-black rounded flex-shrink-0 relative overflow-hidden">
                <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    muted // Essential for autoplay/preview logic
                />
              </div>
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {video.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{video.url}</p>
              </div>
              
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Remove video"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
