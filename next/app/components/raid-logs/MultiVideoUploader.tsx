"use client";

import { useState, useRef } from "react";
import { X, GripVertical, Plus, Link as LinkIcon, Video, Youtube } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { parseVideoUrl, getVideoThumbnail } from "@/app/lib/videoUtils";
import { Button } from "@/app/components/ui/Button";
import { toast } from "sonner";

interface VideoObject {
  url: string;
  type: "upload" | "youtube" | "vimeo" | "short" | "instagram";
  thumbnail?: string;
}

interface MultiVideoUploaderProps {
  videos: VideoObject[];
  onVideosChange: (videos: VideoObject[]) => void;
  maxVideos?: number;
  className?: string;
}

export function MultiVideoUploader({
  videos = [],
  onVideosChange,
  maxVideos = 5,
  className = "",
}: MultiVideoUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddLink = () => {
    if (!videoLink.trim()) return;

    const { id, platform } = parseVideoUrl(videoLink);
    if (!platform || (platform !== "youtube" && platform !== "vimeo" && platform !== "short" && platform !== "instagram")) {
      toast.error("Invalid video URL. Please provide a YouTube, YouTube Shorts, Vimeo, or Instagram link.");
      return;
    }

    if (videos.length >= maxVideos) {
      toast.error(`You can only add up to ${maxVideos} videos.`);
      return;
    }

    const newVideo: VideoObject = {
      url: videoLink,
      type: platform as any,
      thumbnail: getVideoThumbnail(videoLink, platform as any)
    };

    onVideosChange([...videos, newVideo]);
    setVideoLink("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const videoFile = files[0];
    if (!videoFile.type.startsWith("video/")) {
      toast.error("Please select a video file.");
      return;
    }

    if (videos.length >= maxVideos) {
      toast.error(`You can only add up to ${maxVideos} videos.`);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("type", "video");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      const data = await response.json();
      const newVideo: VideoObject = {
        url: data.videoUrl,
        type: "upload",
        thumbnail: "/images/video-placeholder.jpg"
      };

      onVideosChange([...videos, newVideo]);
      toast.success("Video uploaded successfully");
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onVideosChange(videos.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
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

    const newVideos = [...videos];
    const [removed] = newVideos.splice(draggedIndex, 1);
    newVideos.splice(dragOverIndex, 0, removed);
    onVideosChange(newVideos);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={cn("space-y-4 font-primary", className)}>
      <div className="flex flex-col gap-3">
        {/* Link Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="Paste YouTube, Shorts, Vimeo, or Instagram link..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-tertiary)] outline-none"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLink())}
            />
          </div>
          <Button 
            type="button" 
            onClick={handleAddLink}
            disabled={!videoLink.trim() || videos.length >= maxVideos}
            className="bg-[var(--color-tertiary)] text-white"
          >
            Add
          </Button>
        </div>

        {/* File Upload */}
        <div className="flex items-center justify-center w-full">
          <label className={cn(
            "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            isUploading ? "bg-gray-100 opacity-60" : "hover:bg-gray-50 border-gray-300"
          )}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Video className="w-6 h-6 mb-2 text-gray-500" />
              <p className="text-xs text-gray-500">
                {isUploading ? "Uploading video..." : "Click to upload video file"}
              </p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="video/*"
              onChange={handleFileUpload}
              disabled={isUploading || videos.length >= maxVideos}
            />
          </label>
        </div>
      </div>

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {videos.map((video, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative group aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 transition-all",
                draggedIndex === index && "opacity-50",
                dragOverIndex === index && "border-[var(--color-tertiary)]"
              )}
            >
              <img
                src={video.thumbnail || "/images/video-placeholder.jpg"}
                alt={`Video ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                {video.type === "youtube" || video.type === "short" ? (
                  <Youtube className="w-8 h-8 text-red-600 fill-white" />
                ) : video.type === "instagram" ? (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-lg">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </div>
                ) : (
                  <Video className="w-8 h-8 text-white" />
                )}
              </div>

              {/* Drag handle */}
              <div className="absolute top-1 left-1 bg-black/50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Badge for Type */}
              <div className="absolute bottom-1 right-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded uppercase font-bold">
                {video.type === "short" ? "Short" : video.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
