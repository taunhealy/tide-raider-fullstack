"use client";
import { useState, useEffect } from "react";
import { Star, Search, X, Bell } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";
import type { LogEntry } from "@/app/types/raidlogs";
import SurfForecastWidget from "../SurfForecastWidget";
import { Button } from "@/app/components/ui/Button";
import { validateFile, compressImageIfNeeded } from "@/app/lib/file";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { useCreateLog } from "@/app/hooks/useCreateLog";
import { useUpdateLog } from "@/app/hooks/useUpdateLog";
import { useBeaches } from "@/app/hooks/useBeaches";
import {
  BlueStarRating,
  InteractiveBlueStarRating,
} from "@/app/lib/scoreDisplayBlueStars";
import { getVideoId } from "@/app/lib/videoUtils";

interface RaidLogFormProps {
  userEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
  beaches?: Beach[];
  entry?: LogEntry;
  isEditing?: boolean;
}

type LogEntryInput = Omit<
  LogEntry,
  "id" | "createdAt" | "updatedAt" | "hasAlert" | "isMyAlert" | "alertId"
>;

// Add this constant at the top of the file, outside the component
const FORM_STATE_KEY = "raid_log_form_state";

export function RaidLogForm({
  userEmail,
  isOpen = false,
  onClose = () => {},
  entry,
  beaches: beachesProp,
}: RaidLogFormProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const router = useRouter();
  const { data: beachesFromHook, isLoading } = useBeaches();
  // Use prop beaches if provided, otherwise use hook data
  const beaches = beachesProp || beachesFromHook;
  const [selectedDate, setSelectedDate] = useState<string>(
    entry?.date ? format(new Date(entry.date), "yyyy-MM-dd") : ""
  );
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [surferRating, setSurferRating] = useState(entry?.surferRating || 0);
  const [comments, setComments] = useState(entry?.comments || "");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(
    entry?.isAnonymous || false
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    entry?.imageUrl || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(
    entry?.isPrivate || false
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [videoUrl, setVideoUrl] = useState(entry?.videoUrl || "");
  const [videoPlatform, setVideoPlatform] = useState<
    "youtube" | "vimeo" | null
  >(entry?.videoPlatform || null);

  console.log("useForecast params:", {
    regionId: selectedBeach?.regionId || "",
    date: selectedDate,
    selectedBeach,
  });

  const {
    data: forecastData,
    isLoading: isLoadingForecast,
    error: forecastError,
  } = useQuery({
    queryKey: ["forecast", selectedBeach?.regionId, selectedDate],
    queryFn: async () => {
      if (!selectedBeach?.regionId || !selectedDate) {
        throw new Error("Missing beach or date");
      }

      const dateStr = new Date(selectedDate).toISOString().split("T")[0];
      const url = `/api/surf-conditions?regionId=${selectedBeach.regionId}&date=${dateStr}`;

      console.log("Fetching forecast from:", url);
      const response = await fetch(url);

      if (!response.ok) {
        console.error("API error:", response.status, response.statusText);
        throw new Error(`Failed to fetch forecast: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      // If data is empty or forecast is missing, try to use the full response
      if (!data || !data.forecast) {
        // If we have scores or other forecast data, try to use that
        if (data.scores) {
          // Extract first beach's forecast data if available
          const firstBeachId = Object.keys(data.scores)[0];
          if (firstBeachId && data.scores[firstBeachId]?.forecastData) {
            return data.scores[firstBeachId].forecastData;
          }
        }

        console.error("No usable forecast data in API response:", data);
        throw new Error("No forecast data available");
      }

      return data.forecast;
    },
    enabled: !!selectedBeach?.regionId && !!selectedDate,
    staleTime: 1000 * 60 * 5,
  });

  // Add debug logging
  useEffect(() => {
    console.log("Forecast Data Debug:", {
      forecastData,
      selectedBeach,
      selectedDate,
      isLoadingForecast,
      hasData: !!forecastData,
      forecastProps: forecastData && {
        id: forecastData.id,
        windSpeed: forecastData.windSpeed,
        windDirection: forecastData.windDirection,
        swellHeight: forecastData.swellHeight,
        swellPeriod: forecastData.swellPeriod,
        swellDirection: forecastData.swellDirection,
      },
    });
  }, [forecastData, selectedBeach, selectedDate, isLoadingForecast]);

  const { data: searchResults, isLoading: isLoadingBeaches } = useQuery({
    queryKey: ["beaches-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const response = await fetch(
        `/api/beaches/search?term=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) throw new Error("Failed to fetch beaches");
      return response.json();
    },
    enabled: searchTerm.length >= 2,
  });

  // Track changes to form fields
  useEffect(() => {
    if (!entry) return;

    const hasChanges =
      selectedDate !== format(new Date(entry.date), "yyyy-MM-dd") ||
      selectedBeach?.name !== entry.beachName ||
      surferRating !== entry.surferRating ||
      comments !== entry.comments ||
      isAnonymous !== entry.isAnonymous ||
      isPrivate !== entry.isPrivate ||
      selectedImage !== null ||
      videoUrl !== entry.videoUrl ||
      videoPlatform !== entry.videoPlatform;

    setHasUnsavedChanges(hasChanges);
  }, [
    entry,
    selectedDate,
    selectedBeach,
    surferRating,
    comments,
    isAnonymous,
    isPrivate,
    selectedImage,
    videoUrl,
    videoPlatform,
  ]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmed) return;
    }
    onClose();
  };

  // Initialize all form fields from entry when entry loads (for editing)
  useEffect(() => {
    if (entry) {
      console.log("Initializing form from entry:", {
        id: entry.id,
        surferRating: entry.surferRating,
        comments: entry.comments,
        date: entry.date,
        beachName: entry.beachName,
        beachId: (entry as any).beachId,
        beach: (entry as any).beach,
      });

      // Update all form fields from entry
      if (entry.date) {
        setSelectedDate(format(new Date(entry.date), "yyyy-MM-dd"));
      }
      if (entry.surferRating !== undefined && entry.surferRating !== null) {
        setSurferRating(entry.surferRating);
      }
      if (entry.comments !== undefined && entry.comments !== null) {
        setComments(entry.comments);
      }
      if (entry.isAnonymous !== undefined) {
        setIsAnonymous(entry.isAnonymous);
      }
      if (entry.isPrivate !== undefined) {
        setIsPrivate(entry.isPrivate);
      }
      if (entry.videoUrl !== undefined && entry.videoUrl !== null) {
        setVideoUrl(entry.videoUrl);
      }
      if (entry.videoPlatform !== undefined && entry.videoPlatform !== null) {
        setVideoPlatform(entry.videoPlatform as "youtube" | "vimeo" | null);
      }
      if (entry.imageUrl && !imagePreview) {
        setImagePreview(entry.imageUrl);
      }
    }
  }, [entry]);

  // Initialize beach from entry when both entry and beaches are available
  useEffect(() => {
    if (entry && beaches && beaches.length > 0) {
      // Only initialize if we don't have a selected beach yet
      if (!selectedBeach) {
        console.log("Initializing beach selection:", {
          entryBeachId: (entry as any).beachId,
          entryBeachName: entry.beachName,
          entryBeach: (entry as any).beach,
          availableBeachesCount: beaches.length,
          availableBeaches: beaches
            ?.slice(0, 3)
            .map((b) => ({ id: b.id, name: b.name })),
        });

        // Try multiple methods to find the beach:
        // 1. Direct beach relation from entry
        // 2. By beachId
        // 3. By beachName
        let matchingBeach: Beach | null = null;

        // Method 1: Check if entry has a beach relation
        if ((entry as any).beach?.id) {
          matchingBeach =
            beaches.find((beach) => beach.id === (entry as any).beach.id) ||
            null;
        }

        // Method 2: Try by beachId
        if (!matchingBeach && (entry as any).beachId) {
          matchingBeach =
            beaches.find((beach) => beach.id === (entry as any).beachId) ||
            null;
        }

        // Method 3: Try by beachName (fallback)
        if (!matchingBeach && entry.beachName) {
          matchingBeach =
            beaches.find((beach) => beach.name === entry.beachName) || null;
        }

        if (matchingBeach) {
          console.log("Found matching beach:", matchingBeach.name);
          setSelectedBeach(matchingBeach);
          setSearchTerm(matchingBeach.name);
        } else {
          console.log("No matching beach found for:", {
            beachId: (entry as any).beachId,
            beachName: entry.beachName,
            entryBeach: (entry as any).beach,
          });
        }
      }
    }
  }, [entry, beaches, selectedBeach]);

  // Add debug logging for beaches
  useEffect(() => {
    console.log("Available beaches:", {
      count: beaches?.length,
      firstThree: beaches?.slice(0, 3).map((b) => ({
        name: b?.name,
        region: b?.region?.name,
        country: b?.region?.country?.name,
      })),
    });
  }, [beaches]);

  useEffect(() => {
    console.log("Selected beach data:", {
      beach: selectedBeach,
      regionId: selectedBeach?.regionId,
      date: selectedDate,
    });
  }, [selectedBeach, selectedDate]);

  const { mutate: createLog } = useCreateLog();
  const { mutate: updateLog } = useUpdateLog();

  // Add effect to restore form state after sign-in
  useEffect(() => {
    if (session?.user) {
      const savedState = localStorage.getItem(FORM_STATE_KEY);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          setSelectedDate(state.selectedDate || "");
          setSelectedBeach(state.selectedBeach || null);
          setSurferRating(state.surferRating || 0);
          setComments(state.comments || "");
          setIsAnonymous(state.isAnonymous || false);
          setIsPrivate(state.isPrivate || false);
          setVideoUrl(state.videoUrl || "");
          setVideoPlatform(state.videoPlatform || null);

          // Clean up
          localStorage.removeItem(FORM_STATE_KEY);
        } catch (error) {
          console.error("Error restoring form state:", error);
          localStorage.removeItem(FORM_STATE_KEY);
        }
      }
    }
  }, [session]);

  // Function to save form state before sign-in
  const saveFormState = () => {
    const formState = {
      selectedDate,
      selectedBeach,
      surferRating,
      comments,
      isAnonymous,
      isPrivate,
      videoUrl,
      videoPlatform,
    };

    localStorage.setItem(FORM_STATE_KEY, JSON.stringify(formState));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      saveFormState();
      toast.error("Please sign in to log your session", {
        action: {
          label: "Sign In",
          onClick: () =>
            signIn("google", {
              callbackUrl: `${window.location.origin}/raidlogs/new`,
            }),
        },
      });
      return;
    }

    if (!selectedBeach || !selectedDate) {
      toast.error("Please select a beach and date");
      return;
    }

    // For editing, allow using existing forecast if no new forecast data
    if (!entry?.id && !forecastData?.id) {
      toast.error("No forecast data available for this date");
      return;
    }

    try {
      // Upload image if selected
      let uploadedUrl = null;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        uploadedUrl = data.imageUrl;
      }

      // Use existing image URL if no new image uploaded and editing
      const finalImageUrl =
        uploadedUrl ||
        (entry?.imageUrl && !selectedImage ? entry.imageUrl : uploadedUrl);

      const logData = {
        selectedBeach,
        selectedDate,
        forecastData: forecastData || entry?.forecast,
        isAnonymous,
        surferRating,
        comments,
        isPrivate,
        uploadedImageUrl: finalImageUrl,
        videoUrl,
        videoPlatform,
      };

      // If editing, update instead of create
      if (entry?.id) {
        await updateLog({
          id: entry.id,
          ...logData,
        });
      } else {
        await createLog(logData);
      }

      router.push("/raidlogs");
      if (onClose) onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit log entry: " + (error as Error).message);
    }
  };

  const handleBeachSelect = (beach: Beach) => {
    setSelectedBeach(beach);
    setSearchTerm("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const processedFile = await compressImageIfNeeded(file);
      setSelectedImage(processedFile);
      setImagePreview(URL.createObjectURL(processedFile));
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image");
    }
  };

  const safeParseFloat = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === "string") {
      value = value.replace(",", ".");
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const validateVideoUrl = (
    url: string,
    platform: "youtube" | "vimeo" | null
  ): boolean => {
    if (!url || !platform) return true; // Empty values are valid
    const videoId = getVideoId(url, platform);
    return !!videoId;
  };

  // Add this before rendering SurfForecastWidget
  console.log("Data being passed to SurfForecastWidget:", {
    forecastData,
    expectedShape: {
      windSpeed: "number",
      windDirection: "number",
      swellHeight: "number",
      swellPeriod: "number",
      swellDirection: "number",
    },
  });

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Only clean up if user is signed in (form submitted) or left the page
      if (session?.user || !document.hidden) {
        localStorage.removeItem(FORM_STATE_KEY);
      }
    };
  }, [session?.user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white max-h-[90vh] overflow-y-auto p-6 rounded-lg w-full max-w-md">
        <div className="relative">
          <button
            onClick={() => {
              console.log("Close button clicked");
              handleClose();
            }}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-500 z-[102]"
            type="button"
            aria-label="Close form"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-[21px] font-bold mb-6 font-primary text-[var(--color-primary)]">
            {entry ? "Edit Session" : "Log Session"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="steps-container space-y-8">
              <div className="step">
                <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                    1
                  </span>
                  Select Date
                </h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(e.target.value.split("T")[0])
                  }
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="p-2 border rounded w-full"
                  aria-label="Select date"
                />
              </div>

              <div className="step">
                <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                    2
                  </span>
                  Select Beach
                </h3>
                <div className="relative">
                  <div className="flex items-center border rounded-md mb-2">
                    <Search className="h-4 w-4 ml-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search beaches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="p-2 w-full font-primary text-sm focus:outline-none"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="mr-2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {searchTerm && searchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((beach: Beach) => (
                        <div
                          key={beach.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer font-primary"
                          onClick={() => {
                            handleBeachSelect(beach);
                            setSearchTerm("");
                          }}
                        >
                          {beach.name}
                          {beach.region?.name && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({beach.region.name})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2 border rounded-md flex justify-between items-center">
                    <span className="font-primary">
                      {selectedBeach
                        ? selectedBeach.name
                        : "Search for a beach..."}
                    </span>
                    {selectedBeach && (
                      <button
                        type="button"
                        onClick={() => setSelectedBeach(null)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Clear selected beach"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {selectedBeach && selectedDate && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      3
                    </span>
                    Surf Conditions
                  </h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {isLoadingForecast ? (
                      <div className="text-gray-600 font-primary">
                        Loading forecast data...
                      </div>
                    ) : forecastError ? (
                      <div className="text-gray-600">
                        No forecast data available for the selected date
                      </div>
                    ) : forecastData ? (
                      <SurfForecastWidget forecast={forecastData} />
                    ) : null}
                  </div>
                </div>
              )}

              {(forecastData || entry?.forecast) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      4
                    </span>
                    Rate Your Session
                  </h3>
                  <InteractiveBlueStarRating
                    rating={surferRating}
                    onRatingChange={setSurferRating}
                    size={24}
                  />
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      5
                    </span>
                    Add Comments
                  </h3>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value.slice(0, 140))}
                    className="w-full p-2 border rounded-lg"
                    rows={4}
                    placeholder="How was your session?"
                    maxLength={140}
                  />
                  <div className="text-sm text-gray-500 mt-1 font-primary">
                    Characters remaining: {250 - comments.length}
                  </div>
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      6
                    </span>
                    Add Photo (Optional)
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full"
                      aria-label="Upload image"
                    />
                    {imagePreview && (
                      <div className="relative w-32 h-32">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      7
                    </span>
                    Add Video (Optional)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-primary mb-1">
                        Video Platform
                      </label>
                      <select
                        value={videoPlatform || ""}
                        onChange={(e) =>
                          setVideoPlatform(
                            e.target.value
                              ? (e.target.value as "youtube" | "vimeo")
                              : null
                          )
                        }
                        className="w-full p-2 border rounded-lg"
                        aria-label="Select video platform"
                      >
                        <option value="">Select Platform</option>
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-primary mb-1">
                        Video URL
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder={`Enter ${videoPlatform === "youtube" ? "YouTube" : videoPlatform === "vimeo" ? "Vimeo" : "video"} URL`}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>

                    {videoUrl &&
                      videoPlatform &&
                      !validateVideoUrl(videoUrl, videoPlatform) && (
                        <p className="text-red-500 text-sm">
                          Please enter a valid{" "}
                          {videoPlatform === "youtube" ? "YouTube" : "Vimeo"}{" "}
                          URL
                        </p>
                      )}
                  </div>
                </div>
              )}

              <div className="step border-t pt-6">
                <h3 className="text-[16px] font-semibold mb-4 font-primary text-[var(--color-primary)] flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                    8
                  </span>
                  Additional Options
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="anonymous"
                      className="font-primary text-[14px]"
                    >
                      Post Anonymously
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="private"
                      className="font-primary text-[14px]"
                    >
                      Keep Private
                    </label>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                variant="ghost"
                disabled={
                  (!forecastData && !entry?.forecast) ||
                  !selectedBeach ||
                  !selectedDate ||
                  isSubmitting
                }
                className="w-full font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90 py-2 mt-4"
                onClick={(e) => {
                  if (!session?.user) {
                    e.preventDefault();
                    saveFormState();
                    toast.error("Please sign in to log your session", {
                      action: {
                        label: "Sign In",
                        onClick: () =>
                          signIn("google", {
                            callbackUrl: `${window.location.origin}/raidlogs/new`,
                          }),
                      },
                    });
                    return;
                  }
                }}
              >
                {isSubmitting
                  ? "Submitting..."
                  : !session?.user
                    ? "Sign In to Log Session"
                    : entry
                      ? "Update Session"
                      : "Log Session"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
