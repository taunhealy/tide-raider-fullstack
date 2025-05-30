"use client";

import { useState, useEffect } from "react";
import {
  AD_CATEGORIES,
  ADVENTURE_AD_CATEGORIES,
  type AdCategory,
  type AdventureAdCategory,
} from "@/app/lib/advertising/constants";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AdvertisingFormData, CreateAdRequestPayload } from "@/app/types/ads";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define Zod schema for form validation
const formSchema = z.object({
  companyName: z.string().min(1, "Business name is required"),
  websiteUrl: z
    .string()
    .min(1, "URL is required")
    .transform((url) => {
      if (!/^https?:\/\//i.test(url)) {
        return `https://${url}`;
      }
      return url;
    })
    .refine((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }, "Please enter a valid URL"),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
  customCategory: z.string().optional(),
});

// Add a search input component
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  label,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  label: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">
        {label}
      </label>
      <div
        className="border border-gray-300 rounded-md p-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-1">
            {value.length > 0 ? (
              value.map((v) => {
                const option = options.find((o) => o.value === v);
                return option ? (
                  <span
                    key={v}
                    className="bg-[var(--color-tertiary-light)] text-[var(--color-tertiary-dark)] px-2 py-1 rounded-md text-sm font-primary"
                  >
                    {option.label}
                    <button
                      className="ml-1 text-[var(--color-tertiary-dark)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(value.filter((val) => val !== v));
                      }}
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-gray-500 font-primary">{placeholder}</span>
            )}
          </div>
          <span>{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 sticky top-0 bg-white border-b">
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md font-primary"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className={`p-2 cursor-pointer hover:bg-gray-100 font-primary ${
                  value.includes(option.value)
                    ? "bg-[var(--color-tertiary-light)]"
                    : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(
                    value.includes(option.value)
                      ? value.filter((v) => v !== option.value)
                      : [...value, option.value]
                  );
                }}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500 font-primary">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Define types that match your Prisma schema
interface Region {
  id: string;
  name: string;
  country: string;
}

interface Beach {
  id: string;
  name: string;
  region: string; // This is the region name
  regionId: string; // This is the region ID
}

// Add adId prop to component
interface Props {
  adId?: string;
}

export default function AdvertisingForm({ adId }: Props) {
  const { data: session } = useSession();
  const [adType, setAdType] = useState<"local" | "adventure">("local");
  const [selectedCategory, setSelectedCategory] = useState<AdCategory | null>(
    null
  );
  const [selectedAdventureCategory, setSelectedAdventureCategory] =
    useState<AdventureAdCategory | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBeach, setSelectedBeach] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdvertisingFormData>({
    companyName: "",
    websiteUrl: "",
    description: "",
    customCategory: "",
    targetedBeaches: [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // When fetching regions
  const { data: regions = [], isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await fetch("/api/regions");
      if (!response.ok) {
        throw new Error("Failed to fetch regions");
      }
      return response.json();
    },
  });

  const { data: categoryAvailability } = useQuery({
    queryKey: [
      "categoryAvailability",
      selectedBeach,
      selectedCategory,
      selectedAdventureCategory,
      adType,
    ],
    queryFn: async () => {
      if (!selectedBeach || (!selectedCategory && !selectedAdventureCategory))
        return null;

      const category =
        adType === "local" ? selectedCategory : selectedAdventureCategory;
      const categoryType = adType === "local" ? "local" : "adventure";

      try {
        const res = await fetch(
          `/api/advertising/ads?beachId=${selectedBeach}&category=${category}&type=${categoryType}`
        );

        if (!res.ok) {
          throw new Error("Failed to check availability");
        }

        const data = await res.json();
        console.log("Availability check response:", data);

        // For development purposes, always return available
        if (process.env.NODE_ENV === "development") {
          return { available: true };
        }

        // The API returns { ads: [] } when no ads exist for this combination
        return {
          available: data.available !== false,
        };
      } catch (error) {
        console.error("Error checking availability:", error);
        return { available: false, hasError: true };
      }
    },
    enabled:
      !!selectedBeach && (!!selectedCategory || !!selectedAdventureCategory),
  });

  // Add this query to check if the selected beach exists in the database
  const { data: beachExists } = useQuery({
    queryKey: ["beachExists", selectedBeach],
    queryFn: async () => {
      if (!selectedBeach) return null;

      try {
        const res = await fetch(`/api/beaches/${selectedBeach}`);
        if (!res.ok) {
          console.warn(`Beach ${selectedBeach} not found in database`);
          return { exists: false };
        }
        return { exists: true };
      } catch (error) {
        console.error("Error checking beach existence:", error);
        return { exists: false };
      }
    },
    enabled: !!selectedBeach,
  });

  // Add this console log to see what's being received
  useEffect(() => {
    if (categoryAvailability) {
      console.log("Current availability state:", categoryAvailability);
    }
  }, [categoryAvailability]);

  // Function to trigger confetti on success
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to upload image to R2 via API
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) {
      console.log("No image file to upload");
      return null;
    }

    setUploadingImage(true);
    console.log("Starting image upload process");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      console.log(
        "Uploading image:",
        imageFile.name,
        imageFile.type,
        imageFile.size
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }

      const data = await response.json();
      console.log("Upload successful, received data:", data);

      if (!data.imageUrl) {
        console.error("Upload response missing imageUrl:", data);
        throw new Error("Upload response missing imageUrl");
      }

      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (
      (!selectedCategory && !selectedAdventureCategory) ||
      !selectedRegion ||
      !selectedBeach
    ) {
      console.log("Missing required fields");
      setError("Please fill in all required fields");
      setIsLoading(false);
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate form data with Zod
    const validationResult = formSchema.safeParse(formData);

    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.format());
      const errors = validationResult.error.format();

      if (errors.companyName?._errors?.length) {
        setError(errors.companyName._errors[0]);
        toast.error(errors.companyName._errors[0]);
        setIsLoading(false);
        return;
      }

      if (errors.websiteUrl?._errors?.length) {
        setError(errors.websiteUrl._errors[0]);
        toast.error(errors.websiteUrl._errors[0]);
        setIsLoading(false);
        return;
      }

      setError("Please check your form inputs");
      toast.error("Please check your form inputs");
      setIsLoading(false);
      return;
    }

    const validatedData = validationResult.success
      ? validationResult.data
      : formData;

    if (!session?.user) {
      setError("You must be logged in to create an ad");
      toast.error("You must be logged in to create an ad");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Starting ad submission process");
      toast.loading("Creating your ad...");

      // Upload image first if provided
      let imageUrl = null;
      if (imageFile) {
        console.log("Uploading image:", imageFile.name);
        try {
          // Call the uploadImage function and wait for the result
          imageUrl = await uploadImage();
          console.log("Image uploaded successfully, URL:", imageUrl);

          if (!imageUrl) {
            console.error("Image upload returned null URL");
            toast.error("Failed to upload image");
            setIsLoading(false);
            return;
          }
        } catch (uploadError) {
          console.error("Error during image upload:", uploadError);
          toast.error("Failed to upload image");
          setIsLoading(false);
          return;
        }
      } else {
        console.log("No image file selected");
      }

      // Determine which category to use and its price
      const category =
        adType === "local" ? selectedCategory : selectedAdventureCategory;
      const categoryObj =
        adType === "local"
          ? AD_CATEGORIES[selectedCategory as keyof typeof AD_CATEGORIES]
          : ADVENTURE_AD_CATEGORIES[
              selectedAdventureCategory as keyof typeof ADVENTURE_AD_CATEGORIES
            ];

      const payload: CreateAdRequestPayload = {
        title: validatedData.companyName,
        companyName: validatedData.companyName,
        contactEmail: session.user.email || "",
        linkUrl: validatedData.websiteUrl,
        description: validatedData.description,
        category: category as string,
        categoryType: adType,
        customCategory: validatedData.customCategory,
        regionId: selectedRegion as string,
        targetedBeaches: [selectedBeach as string],
        status: "pending",
        yearlyPrice: categoryObj?.monthlyPrice || 0,
        imageUrl,
      };

      // Add validation to ensure selectedRegion is not null before submission
      if (!selectedRegion) {
        setError("Please select a region");
        toast.error("Please select a region");
        setIsLoading(false);
        return;
      }

      // Create ad record first
      const adResponse = await fetch("/api/advertising/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!adResponse.ok) {
        const errorData = await adResponse.json();
        console.error("Ad creation error response:", errorData);
        toast.dismiss();
        toast.error(errorData.error || "Failed to create ad");
        throw new Error(errorData.error || "Failed to create ad");
      }

      const { adId } = await adResponse.json();
      console.log("Ad created successfully with ID:", adId);
      toast.dismiss();
      toast.success("Ad created successfully!");

      // Trigger confetti on successful ad creation
      triggerConfetti();

      // Create PayPal subscription
      toast.loading("Preparing payment...");
      const checkoutResponse = await fetch("/api/advertising/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        console.error("Checkout error response:", errorData);
        toast.dismiss();
        toast.error("Failed to create checkout");
        throw new Error("Failed to create checkout");
      }

      const { url } = await checkoutResponse.json();
      console.log("Redirecting to payment URL:", url);
      toast.dismiss();
      toast.success("Redirecting to payment...");

      // Redirect to PayPal
      window.location.href = url;
    } catch (error) {
      console.error("Submission error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to submit request"
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to submit request"
      );
      setIsLoading(false);
    }
  };

  // Add effect to load existing ad data
  useEffect(() => {
    if (adId) {
      const loadAdData = async () => {
        try {
          const response = await fetch(`/api/ads/${adId}/edit`);
          if (!response.ok) throw new Error("Failed to load ad");
          const adData = await response.json();

          // Set form state from existing data
          setFormData({
            companyName: adData.companyName,
            websiteUrl: adData.linkUrl,
            description: adData.description || "",
            customCategory: adData.customCategory || "",
            targetedBeaches: adData.targetedBeaches || [],
          });

          // Set region and beach
          setSelectedRegion(adData.regionId);
          setSelectedBeach(adData.beaches[0]?.id);

          // Set category based on categoryType
          if (adData.categoryType === "local") {
            setSelectedCategory(adData.category as AdCategory);
          } else {
            setSelectedAdventureCategory(
              adData.category as AdventureAdCategory
            );
          }

          // Set image preview if exists
          if (adData.imageUrl) {
            setImagePreview(adData.imageUrl);
          }
        } catch (error) {
          console.error("Error loading ad data:", error);
          toast.error("Failed to load ad data");
        }
      };

      loadAdData();
    }
  }, [adId]);

  // Add this query to fetch beaches when a region is selected
  const { data: beaches = [], isLoading: isLoadingBeaches } = useQuery({
    queryKey: ["beaches", selectedRegion],
    queryFn: async () => {
      if (!selectedRegion) return [];
      const response = await fetch(`/api/beaches?regionId=${selectedRegion}`);
      if (!response.ok) {
        throw new Error("Failed to fetch beaches");
      }
      return response.json();
    },
    enabled: !!selectedRegion, // Only run when selectedRegion is available
  });

  // Make sure to add null checks when using beaches
  const beachOptions = Array.isArray(beaches)
    ? beaches.map((beach: Beach) => ({
        value: beach.id,
        label: `${beach.name} (${beach.region})`,
      }))
    : [];

  // Update the filteredBeachOptions to use numeric region IDs:
  const filteredBeachOptions = Array.isArray(beachOptions)
    ? beachOptions.filter((option: any) => {
        const beach = Array.isArray(beaches)
          ? beaches.find((b: any) => b.id === option.value)
          : null;
        // Find the region object that matches the beach's region name
        const region = Array.isArray(regions)
          ? regions.find((r) => r.name === beach?.region)
          : null;
        return beach && region && region.id.toString() === selectedRegion;
      })
    : [];

  // Add this console log to debug
  console.log({
    selectedRegion,
    beachCount: beaches.length,
    filteredCount: filteredBeachOptions.length,
    regions: regions.map((r: Region) => r.id),
    sampleBeachRegions: beaches.slice(0, 3).map((b: any) => ({
      name: b.name,
      region: b.region,
      regionId: b.regionId,
    })),
  });

  // Add this near your beach selection code
  useEffect(() => {
    if (selectedBeach) {
      console.log(`Selected beach ID: ${selectedBeach}`);

      // Fetch the beach directly to check if it exists
      fetch(`/api/beaches/${selectedBeach}`)
        .then((res) => {
          if (!res.ok) {
            console.warn(`Beach ${selectedBeach} not found in database`);
          } else {
            return res.json();
          }
        })
        .then((data) => {
          if (data) {
            console.log("Beach found in database:", data);
          }
        })
        .catch((err) => {
          console.error("Error checking beach:", err);
        });
    }
  }, [selectedBeach]);

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-8 font-primary text-[var(--color-primary)]">
        Create Your Ad
      </h2>

      <div className="mb-8 bg-[var(--color-tertiary-light)] p-5 rounded-lg border border-[var(--color-tertiary-lighter)]">
        <p className="text-[var(--color-primary)] font-primary flex items-center">
          <span className="mr-2 text-xl">♻️</span>
          <span>
            <span className="font-semibold">Recycling Ads:</span> 30% of all
            advertising revenue is dedicated to Google Ads campaigns promoting
            Tide Raider.
          </span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg mb-6 font-primary">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <label className="block mb-3 font-primary font-medium text-[var(--color-primary)]">
            Ad Type
          </label>
          <div className="flex space-x-4 mb-6">
            <button
              type="button"
              className={`px-5 py-3 rounded-lg font-primary transition-all ${
                adType === "local"
                  ? "bg-[var(--color-tertiary)] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => {
                setAdType("local");
                setSelectedAdventureCategory(null);
              }}
            >
              Local Services
            </button>
            <button
              type="button"
              className={`px-5 py-3 rounded-lg font-primary transition-all ${
                adType === "adventure"
                  ? "bg-[var(--color-tertiary)] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => {
                setAdType("adventure");
                setSelectedCategory(null);
              }}
            >
              Adventure Experiences
            </button>
          </div>

          {adType === "local" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(AD_CATEGORIES).map(([key, category]) => (
                <div
                  key={key}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCategory === key
                      ? "border-[var(--color-tertiary)] bg-[var(--color-tertiary-light)]"
                      : "border-gray-200 hover:border-[var(--color-tertiary)]"
                  }`}
                  onClick={() => setSelectedCategory(key as AdCategory)}
                >
                  <h3 className="font-bold mb-1 font-primary text-[var(--color-primary)]">
                    {category.emoji} {category.label}
                  </h3>
                  <p className="font-medium text-sm text-gray-600 font-primary">
                    <span className="font-bold text-base text-[var(--color-tertiary-dark)]">
                      R{category.monthlyPrice}
                    </span>
                    /month
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(ADVENTURE_AD_CATEGORIES).map(
                ([key, category]) => (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedAdventureCategory === key
                        ? "border-[var(--color-tertiary)] bg-[var(--color-tertiary-light)]"
                        : "border-gray-200 hover:border-[var(--color-tertiary)]"
                    }`}
                    onClick={() =>
                      setSelectedAdventureCategory(key as AdventureAdCategory)
                    }
                  >
                    <h3 className="font-bold mb-1 font-primary text-[var(--color-primary)]">
                      {category.emoji} {category.label}
                    </h3>
                    <p className="font-medium text-sm text-gray-600 font-primary">
                      <span className="font-bold text-base text-[var(--color-tertiary-dark)]">
                        R{category.monthlyPrice}
                      </span>
                      /month
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Custom category input for "Other" options */}
        {(selectedCategory === "OTHER" ||
          selectedAdventureCategory === "OTHER_ADVENTURE") && (
          <div className="mb-6">
            <label htmlFor="customCategory" className="block mb-2 font-primary">
              Custom Category Name
            </label>
            <input
              type="text"
              id="customCategory"
              className="w-full p-2 border border-gray-300 rounded-md font-primary"
              value={formData.customCategory || ""}
              onChange={(e) =>
                setFormData({ ...formData, customCategory: e.target.value })
              }
              placeholder="Enter your custom category"
            />
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1 font-primary">
            Region
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md font-primary"
            value={selectedRegion || ""}
            onChange={(e) => setSelectedRegion(e.target.value)}
            required
          >
            <option value="">Select a region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRegion && (
          <div className="mb-6">
            <label htmlFor="beach" className="block mb-2 font-primary">
              Select Beach
            </label>
            {isLoadingBeaches ? (
              <p className="text-gray-500 font-primary">Loading beaches...</p>
            ) : beaches && beaches.length > 0 ? (
              <select
                id="beach"
                className="w-full p-2 border border-gray-300 rounded-md font-primary"
                value={selectedBeach || ""}
                onChange={(e) => setSelectedBeach(e.target.value)}
              >
                <option value="">Select a beach</option>
                {beaches.map((beach: Beach) => (
                  <option key={beach.id} value={beach.id}>
                    {beach.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-500 font-primary">
                No beaches found for this region
              </p>
            )}
          </div>
        )}

        {selectedBeach &&
          (selectedCategory || selectedAdventureCategory) &&
          categoryAvailability && (
            <div
              className={`mb-6 p-4 rounded-md ${
                categoryAvailability.available
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <p className="font-primary">
                {categoryAvailability.available
                  ? "This ad slot is available!"
                  : "This ad slot is currently taken. Please choose another beach or category."}
              </p>
            </div>
          )}

        {selectedBeach && (selectedCategory || selectedAdventureCategory) && (
          <div className="mb-6 p-4 rounded-md bg-gray-100">
            <p className="font-primary font-bold">Debug Info:</p>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(categoryAvailability, null, 2)}
            </pre>
          </div>
        )}

        {selectedBeach && beachExists?.exists === false && (
          <div className="mt-2 text-amber-600 font-primary">
            Warning: This beach may not exist in the database yet. Ad creation
            might fail.
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="companyName" className="block mb-2 font-primary">
            Business Name
          </label>
          <input
            type="text"
            id="companyName"
            className="w-full p-2 border border-gray-300 rounded-md font-primary"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
          />
        </div>

        <div className="mb-6">
          <label htmlFor="websiteUrl" className="block mb-2 font-primary">
            Website URL
          </label>
          <input
            type="text"
            id="websiteUrl"
            className="w-full p-2 border border-gray-300 rounded-md font-primary"
            placeholder="https://example.com"
            value={formData.websiteUrl}
            onChange={(e) =>
              setFormData({ ...formData, websiteUrl: e.target.value })
            }
          />
          <p className="text-sm text-gray-500 mt-1 font-primary">
            Enter your website URL (https:// will be added if missing)
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block mb-2 font-primary">
            Ad Description
          </label>
          <textarea
            id="description"
            className="w-full p-2 border border-gray-300 rounded-md font-primary resize-none"
            rows={3}
            maxLength={200}
            placeholder="Briefly describe your business or service (max 200 characters)"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <p className="text-sm text-gray-500 mt-1 font-primary flex justify-between">
            <span>Briefly describe what you offer</span>
            <span>{(formData.description || "").length}/200</span>
          </p>
        </div>

        {/* Add image upload section */}
        <div className="mb-6">
          <label htmlFor="adImage" className="block mb-2 font-primary">
            Ad Image
          </label>
          <div className="flex flex-col space-y-2">
            <input
              type="file"
              id="adImage"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border border-gray-300 rounded-md font-primary"
            />
            <p className="text-sm text-gray-500 font-primary">
              Upload an image for your ad (recommended size: 800x600px)
            </p>

            {imagePreview && (
              <div className="mt-2 relative">
                <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Ad preview"
                    className="object-cover w-full h-full"
                  />
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  <span className="text-gray-500">×</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[var(--color-secondary)] text-white py-4 px-6 rounded-lg hover:opacity-80 transition-opacity mt-8 font-primary font-medium flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          disabled={
            isLoading || uploadingImage || !session
            // Temporarily comment out the availability check for testing
            // || (!!selectedBeach &&
            //   (!!selectedCategory || !!selectedAdventureCategory) &&
            //   !categoryAvailability?.available)
          }
        >
          {isLoading || uploadingImage ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {uploadingImage ? "Uploading image..." : "Processing..."}
            </>
          ) : (
            <>
              Continue to Payment - R
              {adType === "local" && selectedCategory
                ? AD_CATEGORIES[selectedCategory].monthlyPrice
                : adType === "adventure" && selectedAdventureCategory
                  ? ADVENTURE_AD_CATEGORIES[selectedAdventureCategory]
                      .monthlyPrice
                  : 0}
              /month
            </>
          )}
        </button>

        <div className="mt-4 text-sm text-red-600 font-primary">
          {!session && <p>Please sign in to create an ad</p>}
          {!selectedCategory && !selectedAdventureCategory && (
            <p>Please select an ad category</p>
          )}
          {!selectedRegion && <p>Please select a region</p>}
          {!selectedBeach && selectedRegion && <p>Please select a beach</p>}
          {selectedBeach &&
            (selectedCategory || selectedAdventureCategory) &&
            !categoryAvailability?.available && (
              <p>
                This ad slot is not available. Please select another beach or
                category.
              </p>
            )}
        </div>

        {formData.regionId && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Target Beach
            </label>
            {beaches.length > 0 ? (
              <select
                name="targetedBeaches"
                value={formData.targetedBeaches?.[0] || ""}
                onChange={(e) => {
                  const beachId = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    targetedBeaches: beachId ? [beachId] : [],
                  }));
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a beach</option>
                {beaches.map((beach: any) => (
                  <option key={beach.id} value={beach.id}>
                    {beach.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded-md bg-gray-50">
                {isLoadingBeaches
                  ? "Loading beaches..."
                  : "No beaches found for this region"}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
