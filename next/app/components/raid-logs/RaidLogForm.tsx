"use client";
import { useState, useEffect } from "react";
import { Star, Search, X, Lock, Bell } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";
import type { LogEntry } from "@/app/types/raidlogs";
import SurfForecastWidget from "../SurfForecastWidget";
import confetti from "canvas-confetti";
import { Button } from "@/app/components/ui/Button";
import { validateFile, compressImageIfNeeded } from "@/app/lib/file";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { useSession } from "next-auth/react";
import { useHandleTrial } from "@/app/hooks/useHandleTrial";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useForecast } from "@/app/hooks/useForecast";
import Image from "next/image";
import { useAppMode } from "@/app/context/AppModeContext";

interface RaidLogFormProps {
  userEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
  beaches: Beach[];
  entry?: LogEntry;
  isEditing?: boolean;
}

type LogEntryInput = Omit<
  LogEntry,
  "id" | "createdAt" | "updatedAt" | "hasAlert" | "isMyAlert" | "alertId"
>;

export function RaidLogForm({
  userEmail,
  isOpen = false,
  onClose = () => {},
  beaches,
  entry,
}: RaidLogFormProps) {
  const queryClient = useQueryClient();
  const { isBetaMode } = useAppMode();
  const { isSubscribed, hasActiveTrial } = useSubscription();
  const { data: session } = useSession();
  const router = useRouter();
  const { mutate: handleTrial } = useHandleTrial();
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
  const [forecast, setForecast] = useState<any>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(
    entry?.isPrivate || false
  );

  const { data: forecastData } = useForecast(
    selectedBeach?.region?.name || "",
    new Date(selectedDate)
  );

  const createLogEntry = useMutation({
    mutationFn: async (newEntry: LogEntryInput) => {
      const method = entry?.id ? "PATCH" : "POST";
      const response = await fetch(
        `/api/raid-logs${entry?.id ? `/${entry.id}` : ""}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEntry),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit log entry");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["raidLogs"] });
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 },
      });
      setIsSubmitted(true);

      router.push("/raidlogs");
      if (onClose) {
        onClose();
      }
    },
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");

    const data = await response.json();
    return data.imageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBeach || !selectedDate) {
      toast.error("Please select a beach and date");
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle image upload if an image is selected (for any rating)
      let imageUrl = "";
      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      }

      // Create the log entry with the image URL
      const newEntry = {
        beachName: selectedBeach.name,
        date: new Date(selectedDate),
        surferEmail: userEmail,
        surferName: isAnonymous
          ? "Anonymous"
          : (session?.user as { name?: string })?.name ||
            userEmail?.split("@")[0] ||
            "Anonymous Surfer",
        userId: session!.user.id,
        surferRating,
        comments,
        continent: selectedBeach.continent,
        country: selectedBeach.country?.name || null,
        region: selectedBeach.region?.name || null,
        waveType: selectedBeach.waveType,
        isAnonymous,
        isPrivate,
        forecast: forecastData,
        imageUrl: imageUrl || undefined,
      };

      await createLogEntry.mutateAsync(newEntry);

      toast.success("Session logged successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit log entry: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBeaches =
    beaches?.filter((beach) =>
      beach.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  console.log("Search term:", searchTerm);
  console.log("Available beaches:", beaches?.length);
  console.log("Filtered beaches:", filteredBeaches.length);

  const handleBeachSelect = (beach: Beach) => {
    setSelectedBeach(beach);
    setSearchTerm("");
  };

  const fetchForecastData = async (beach: Beach) => {
    try {
      const fetchWithRetry = async (retryAttempt = 0, maxRetries = 3) => {
        if (retryAttempt >= maxRetries) {
          throw new Error("Maximum retry attempts reached");
        }

        const response = await fetch(
          `/api/surf-conditions?` +
            new URLSearchParams({
              date: selectedDate,
              regionId: beach.regionId,
              retry: retryAttempt.toString(),
            })
        );

        const data = await response.json();

        if (response.status === 202) {
          console.log(`Attempt ${retryAttempt + 1}: Retrying in 5 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return fetchWithRetry(retryAttempt + 1, maxRetries);
        }

        if (!response.ok) {
          console.error("Forecast fetch error:", data);
          if (data.error) {
            throw new Error(data.error);
          }
          throw new Error(`Failed to fetch forecast: ${response.statusText}`);
        }

        console.log("Received forecast data:", data);

        const formattedData = {
          date: new Date(selectedDate),
          region: beach.region,
          windSpeed: parseInt(data.windSpeed) || 0,
          windDirection: parseFloat(data.windDirection) || 0,
          swellHeight: parseFloat(data.swellHeight) || 0,
          swellPeriod: parseInt(data.swellPeriod) || 0,
          swellDirection: parseFloat(data.swellDirection) || 0,
        };

        console.log("Formatted forecast data:", formattedData);
        setForecast(formattedData);
        return formattedData;
      };

      return fetchWithRetry();
    } catch (error) {
      console.error("Error loading forecast:", error);
      setForecast(null);
      alert(
        `Unable to load forecast data: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return null;
    }
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

  useEffect(() => {
    if (!beaches || !entry?.beachName) return;

    const initialBeach = beaches.find((b) => b.name === entry.beachName);
    if (initialBeach) {
      setSelectedBeach(initialBeach);
    }
  }, [entry, beaches]);

  useEffect(() => {
    if (selectedBeach && selectedDate) {
      fetchForecastData(selectedBeach);
    }
  }, [selectedBeach, selectedDate]);

  const safeParseFloat = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === "string") {
      value = value.replace(",", ".");
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const debugForecastData = (data: any) => {
    if (!data) return;
    console.log("Forecast data for alert:", {
      windSpeed: safeParseFloat(data.windSpeed),
      windDirection: safeParseFloat(data.windDirection),
      swellHeight: safeParseFloat(data.swellHeight),
      swellPeriod: safeParseFloat(data.swellPeriod),
      swellDirection: safeParseFloat(data.swellDirection),
    });
  };

  useEffect(() => {
    if (forecastData) {
      debugForecastData(forecastData);
    }
  }, [forecastData]);

  const handleSubscriptionAction = () => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    if (!hasActiveTrial) {
      handleTrial({});
    } else {
      router.push("/pricing");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white max-h-[90vh] overflow-y-auto p-6 rounded-lg w-full max-w-md">
        {!isBetaMode && !isSubscribed && !hasActiveTrial && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 rounded-lg" />
        )}

        {!isBetaMode && !isSubscribed && !hasActiveTrial && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-4 bg-white/50">
            <Lock className="h-16 w-16 text-gray-400" />
            <div className="text-center px-4">
              <h3 className="text-lg font-semibold mb-2 font-primary">
                Start Logging Your Sessions
              </h3>
              <p className="text-gray-600 mb-4 font-primary">
                Track your surf journey with detailed logs and insights
              </p>
              <Button
                variant="secondary"
                onClick={handleSubscriptionAction}
                className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
              >
                {!session?.user
                  ? "Sign in to Start"
                  : hasActiveTrial
                    ? "Subscribe Now"
                    : "Start Free Trial"}
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => {
              console.log("Close button clicked");
              onClose();
            }}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-500 z-[102]"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-bold mb-6 font-primary text-[var(--color-primary)]">
            {entry?.id ? "Edit Session" : "Log Session"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="steps-container space-y-8">
              <div className="step">
                <h3 className="text-lg font-semibold mb-3 font-primary text-[var(--color-secondary)]">
                  1. Select Date
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
                />
              </div>

              <div className="step">
                <h3 className="text-lg font-semibold mb-3 font-primary text-[var(--color-secondary)]">
                  2. Select Beach
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
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {searchTerm && filteredBeaches.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredBeaches.map((beach) => (
                        <div
                          key={beach.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer font-primary"
                          onClick={() => {
                            handleBeachSelect(beach);
                            setSearchTerm("");
                          }}
                        >
                          {beach.name}
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
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {selectedBeach && selectedDate && (
                <div className="step">
                  <h3 className="text-lg font-semibold mb-3 font-primary text-[var(--color-secondary)]">
                    3. Surf Conditions
                  </h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {forecast === null ? (
                      <div className="text-black font-primary">Loading...</div>
                    ) : !forecast ? (
                      <div className="text-gray-600 font-primary">
                        Loading forecast data...
                      </div>
                    ) : (
                      <SurfForecastWidget
                        beachId={selectedBeach.id}
                        selectedDate={selectedDate}
                        forecast={forecast}
                      />
                    )}
                  </div>
                </div>
              )}

              {forecastData && (
                <div className="step">
                  <h3 className="text-lg font-semibold mb-3 font-primary text-[var(--color-secondary)]">
                    4. Rate Your Session
                  </h3>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setSurferRating(rating)}
                        className={cn(
                          "p-1",
                          rating <= surferRating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        )}
                      >
                        <Star className="w-8 h-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {surferRating > 0 && (
                <div className="step">
                  <h3 className="text-lg font-semibold mb-3 font-primary text-[var(--color-secondary)]">
                    5. Add Comments
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

              {surferRating > 0 && (
                <div className="step">
                  <h3 className="text-lg font-semibold mb-3 font-primary text-[var(--color-secondary)]">
                    6. Add Photo
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full"
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
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="step border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 font-primary text-[var(--color-secondary)]">
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
                    <label htmlFor="anonymous" className="font-primary">
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
                    <label htmlFor="private" className="font-primary">
                      Keep Private
                    </label>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                disabled={
                  !forecastData ||
                  !selectedBeach ||
                  !selectedDate ||
                  isSubmitting
                }
                className="w-full font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90 py-2 mt-4"
              >
                {isSubmitting
                  ? "Submitting..."
                  : entry?.id
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
