"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  SkipForward,
  SkipBack,
} from "lucide-react";

interface CustomVideoPlayerProps {
  videoUrl: string;
  className?: string;
}

export function CustomVideoPlayer({
  videoUrl,
  className = "",
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userExplicitlyMuted = useRef(false); // Track if user explicitly muted

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false); // Always start unmuted for sound
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  // Initialize video element - ensure it starts paused and unmuted for sound
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset explicit mute flag when video URL changes
    userExplicitlyMuted.current = false;

    // Only set initial state if video hasn't loaded yet
    // Don't pause if video is already playing (prevents interrupting play())
    if (video.readyState === 0 || video.paused) {
      // Video not loaded or already paused - safe to set initial state
      video.muted = false;
      video.volume = 1.0;
      setIsMuted(false);
      setVolume(1.0);
      if (!video.paused) {
        video.pause();
      }
    } else {
      // Video is loaded and might be playing - just update audio settings
      if (!userExplicitlyMuted.current) {
        video.muted = false;
        video.volume = 1.0;
        setIsMuted(false);
        setVolume(1.0);
      }
    }

    setIsPlaying(!video.paused);

    console.log("[CustomVideoPlayer] Video initialized - unmuted for sound");
  }, [videoUrl]);

  // Format time for display (mm:ss)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle video metadata loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);

      // Detect video aspect ratio (portrait vs landscape)
      if (video.videoWidth && video.videoHeight) {
        const aspectRatio = video.videoWidth / video.videoHeight;
        setVideoAspectRatio(aspectRatio);
        setIsPortrait(aspectRatio < 1); // Portrait if width < height
        console.log("[CustomVideoPlayer] Video aspect ratio detected:", {
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio,
          isPortrait: aspectRatio < 1,
        });
      }

      // Ensure video is unmuted and has volume set for sound
      if (!userExplicitlyMuted.current) {
        video.volume = 1.0; // Full volume for sound
        video.muted = false; // Explicitly unmuted for sound
        setVolume(1.0);
        setIsMuted(false);
      }
      // Don't pause here if video is already paused - avoid interrupting play()
      // Only pause if video is trying to autoplay
      if (!video.paused) {
        video.pause();
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () =>
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  // Handle time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isDragging) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [isDragging]);

  // Handle play/pause state - only listen to events, don't control playback here
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Don't pause here - let the initialization effect handle that
    // Just set up event listeners to track state

    const handlePlay = () => {
      // Ensure unmuted when playing for sound (unless user explicitly muted)
      if (!userExplicitlyMuted.current && video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      // Reset to start when video ends
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    // Prevent multiple simultaneous play/pause calls
    if (video.readyState < 2) {
      // Video not ready yet, wait for it
      return;
    }

    try {
      if (video.paused) {
        // CRITICAL: Ensure video is unmuted before playing for sound
        // Only unmute if user hasn't explicitly muted
        if (!userExplicitlyMuted.current) {
          setIsMuted(false);
          setVolume(1.0);
          video.muted = false;
          video.volume = 1.0;
        }

        // Play video - don't await, let it play asynchronously
        const playPromise = video.play();

        // Handle play promise
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
              setIsPlaying(true);
            })
            .catch((error) => {
              // Playback failed (e.g., autoplay policy)
              console.warn("[CustomVideoPlayer] Play failed:", error);
              setIsPlaying(false);
            });
        }
      } else {
        // Pause video
        video.pause();
        setIsPlaying(false);
      }
      setShowControls(true);
    } catch (error) {
      // Handle any other errors
      console.error("[CustomVideoPlayer] Error in togglePlay:", error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    // Toggle mute state and track that user explicitly muted/unmuted
    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    userExplicitlyMuted.current = newMutedState; // Track explicit user action

    // If unmuting, restore volume
    if (!newMutedState && volume === 0) {
      video.volume = 1.0;
      setVolume(1.0);
    }

    setShowControls(true);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isVolumeDragging) return;
    const video = videoRef.current;
    const slider = volumeSliderRef.current;
    if (!video || !slider) return;

    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newVolume = percentage;

    video.volume = newVolume;
    video.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    setShowControls(true);
  };

  const handleVolumeDrag = useCallback(
    (e: MouseEvent) => {
      if (!isVolumeDragging) return;
      const video = videoRef.current;
      const slider = volumeSliderRef.current;
      if (!video || !slider) return;

      const rect = slider.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newVolume = percentage;

      video.volume = newVolume;
      video.muted = newVolume === 0;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    },
    [isVolumeDragging]
  );

  const handleVolumeDragStart = () => {
    setIsVolumeDragging(true);
    setShowControls(true);
  };

  const handleVolumeDragEnd = () => {
    setIsVolumeDragging(false);
  };

  useEffect(() => {
    if (isVolumeDragging) {
      document.addEventListener("mousemove", handleVolumeDrag);
      document.addEventListener("mouseup", handleVolumeDragEnd);
      return () => {
        document.removeEventListener("mousemove", handleVolumeDrag);
        document.removeEventListener("mouseup", handleVolumeDragEnd);
      };
    }
  }, [isVolumeDragging, handleVolumeDrag]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar || isDragging) return;

    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
    setShowControls(true);
  };

  const handleProgressDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const video = videoRef.current;
      const progressBar = progressBarRef.current;
      if (!video || !progressBar) return;

      const rect = progressBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;

      video.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [isDragging, duration]
  );

  const handleProgressDragStart = () => {
    setIsDragging(true);
    setShowControls(true);
  };

  const handleProgressDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleProgressDrag);
      document.addEventListener("mouseup", handleProgressDragEnd);
      return () => {
        document.removeEventListener("mousemove", handleProgressDrag);
        document.removeEventListener("mouseup", handleProgressDragEnd);
      };
    }
  }, [isDragging, handleProgressDrag]);

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(
      0,
      Math.min(duration, video.currentTime + seconds)
    );
    setShowControls(true);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setShowControls(true);
  };

  const changePlaybackRate = () => {
    const video = videoRef.current;
    if (!video) return;

    const rates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];

    video.playbackRate = newRate;
    setPlaybackRate(newRate);
    setShowControls(true);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Calculate container height based on aspect ratio
  // For portrait videos, constrain to viewport height
  const containerClasses =
    isPortrait && videoAspectRatio
      ? `relative w-full bg-black rounded-lg overflow-hidden max-h-[80vh] ${className}`
      : `relative w-full bg-black rounded-lg overflow-hidden ${className}`;

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={
        isPortrait && videoAspectRatio
          ? {
              aspectRatio: `${videoAspectRatio}`,
              maxHeight: "80vh",
              maxWidth: "100%",
            }
          : undefined
      }
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }}
      onMouseLeave={() => {
        if (isPlaying) {
          setTimeout(() => setShowControls(false), 2000);
        }
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer max-h-full"
        style={{
          maxWidth: "100%",
          maxHeight: isPortrait ? "80vh" : "100%",
          objectFit: "contain",
        }}
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        crossOrigin="anonymous"
        preload="metadata"
        onLoadedData={(e) => {
          // CRITICAL: Ensure audio is enabled when video loads (unless user explicitly muted)
          const video = e.currentTarget;
          // Only unmute if user hasn't explicitly muted
          if (!userExplicitlyMuted.current) {
            video.muted = false;
            video.volume = 1.0;
            setIsMuted(false);
            setVolume(1.0);
          }
          console.log("[CustomVideoPlayer] Video loaded - audio settings:", {
            muted: video.muted,
            volume: video.volume,
            userExplicitlyMuted: userExplicitlyMuted.current,
          });
        }}
        onCanPlay={(e) => {
          // Ensure audio is enabled when video can play (unless user explicitly muted)
          const video = e.currentTarget;
          if (!userExplicitlyMuted.current) {
            if (video.muted || isMuted) {
              video.muted = false;
              setIsMuted(false);
            }
            if (video.volume === 0 || volume === 0) {
              video.volume = 1.0;
              setVolume(1.0);
            }
          }
          console.log("[CustomVideoPlayer] Video can play - audio settings:", {
            muted: video.muted,
            volume: video.volume,
            userExplicitlyMuted: userExplicitlyMuted.current,
          });
        }}
        onPlay={(e) => {
          // CRITICAL: Ensure unmuted when playing starts (unless user explicitly muted)
          const video = e.currentTarget;
          if (!userExplicitlyMuted.current) {
            // User hasn't explicitly muted, so ensure audio is on
            if (video.muted || isMuted) {
              video.muted = false;
              setIsMuted(false);
            }
            if (video.volume === 0 || (volume === 0 && !isMuted)) {
              video.volume = 1.0;
              setVolume(1.0);
            }
          }
          console.log("[CustomVideoPlayer] Video playing - audio settings:", {
            muted: video.muted,
            volume: video.volume,
            isMutedState: isMuted,
            userExplicitlyMuted: userExplicitlyMuted.current,
          });
        }}
      />

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          ref={progressBarRef}
          className="absolute bottom-20 left-0 right-0 h-1 bg-white/20 cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={handleProgressDragStart}
        >
          <div
            className="h-full bg-[var(--color-tertiary)] transition-all duration-150 group-hover:h-1.5"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--color-tertiary)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 flex items-center gap-2 md:gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="flex-shrink-0 p-2 text-white hover:text-[var(--color-tertiary)] transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <Play className="w-5 h-5 md:w-6 md:h-6" />
            )}
          </button>

          {/* Skip Back */}
          <button
            onClick={() => skip(-10)}
            className="flex-shrink-0 p-2 text-white hover:text-[var(--color-tertiary)] transition-colors hidden sm:block"
            aria-label="Rewind 10 seconds"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => skip(10)}
            className="flex-shrink-0 p-2 text-white hover:text-[var(--color-tertiary)] transition-colors hidden sm:block"
            aria-label="Fast forward 10 seconds"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleMute}
              className="p-2 text-white hover:text-[var(--color-tertiary)] transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            <div
              ref={volumeSliderRef}
              className="w-20 md:w-24 h-1 bg-white/20 rounded-full cursor-pointer relative group"
              onClick={handleVolumeChange}
              onMouseDown={handleVolumeDragStart}
            >
              <div
                className="h-full bg-[var(--color-tertiary)] rounded-full transition-all"
                style={{ width: `${volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--color-tertiary)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-1 text-white text-xs md:text-sm font-primary flex-shrink-0">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/60">/</span>
            <span className="text-white/60">{formatTime(duration)}</span>
          </div>

          {/* Playback Speed */}
          <button
            onClick={changePlaybackRate}
            className="flex-shrink-0 px-2 py-1 text-white text-xs md:text-sm font-primary hover:text-[var(--color-tertiary)] transition-colors border border-white/20 rounded hover:border-[var(--color-tertiary)] hidden md:block"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}x
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex-shrink-0 p-2 text-white hover:text-[var(--color-tertiary)] transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Maximize className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
