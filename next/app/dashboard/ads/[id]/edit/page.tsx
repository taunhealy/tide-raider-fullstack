"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AD_CATEGORIES,
  ADVENTURE_AD_CATEGORIES,
} from "@/app/lib/advertising/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/app/components/ui/Button";

export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    linkUrl: "",
    imageUrl: "",
    category: "",
    regionId: "",
    categoryType: "local", // Default to local, will be updated when ad loads
    description: "", // Add description field
    targetedBeaches: [] as string[], // Add this for targeted beaches
  });
  const [filteredRegions, setFilteredRegions] = useState<any[]>([]);
  const [beaches, setBeaches] = useState<any[]>([]);
  const [filteredBeaches, setFilteredBeaches] = useState<any[]>([]);
  const [beachSearchTerm, setBeachSearchTerm] = useState("");

  // Fetch ad data
  const { data: ad, isLoading } = useQuery({
    queryKey: ["ad", id],
    queryFn: async () => {
      const response = await fetch(`/api/ads/${id}/edit`);
      if (!response.ok) throw new Error("Failed to fetch ad");
      const data = await response.json();
      return {
        ...data,
        region: data.region || { id: data.regionId, name: data.regionId },
      };
    },
  });

  // Fetch regions
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await fetch("/api/regions");
      if (!response.ok) throw new Error("Failed to fetch regions");
      return response.json();
    },
  });

  // Add a new query to fetch beaches
  const { data: beachesData } = useQuery({
    queryKey: ["beaches", formData.regionId],
    queryFn: async () => {
      if (!formData.regionId) return [];
      const response = await fetch(
        `/api/beaches?regionId=${formData.regionId}`
      );
      if (!response.ok) throw new Error("Failed to fetch beaches");
      return response.json();
    },
    enabled: !!formData.regionId, // Only run when regionId is available
  });

  // Update beaches when beachesData changes
  useEffect(() => {
    if (beachesData) {
      setBeaches(beachesData);
    }
  }, [beachesData]);

  // Update form data when ad data is loaded
  useEffect(() => {
    if (ad) {
      const targetedBeachIds =
        ad.beachConnections?.map((connection: any) => connection.beachId) || [];

      setFormData({
        title: ad.title || "",
        companyName: ad.companyName || "",
        linkUrl: ad.linkUrl || "",
        imageUrl: ad.imageUrl || "",
        category: ad.category || "",
        regionId: ad.region?.id || ad.regionId,
        categoryType: ad.categoryType || "local",
        description: ad.description || "",
        targetedBeaches: targetedBeachIds,
      });
    }
  }, [ad]);

  // Filter beaches based on search term
  useEffect(() => {
    if (beaches.length > 0 && beachSearchTerm) {
      const filtered = beaches.filter((beach: any) =>
        beach.name.toLowerCase().includes(beachSearchTerm.toLowerCase())
      );
      setFilteredBeaches(filtered);
    } else {
      setFilteredBeaches([]);
    }
  }, [beachSearchTerm, beaches]);

  // Update ad mutation
  const updateAdMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/ads/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update ad");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad", id] });
      toast.success("Ad updated successfully");
      router.push(`/dashboard/ads/${id}`);
      router.refresh();
    },
    onError: (error) => {
      console.error("Error updating ad:", error);
      toast.error("Failed to update advertisement");
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");
      return response.json();
    },
    onSuccess: async (data) => {
      console.log("Image uploaded successfully, URL:", data.imageUrl);

      // Update the form state
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));

      // Directly update the image URL in the database
      try {
        // Check if we have a valid URL
        if (!data.imageUrl) {
          throw new Error("No image URL returned from upload");
        }

        const response = await fetch(`/api/ads/${id}/edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: data.imageUrl }),
        });

        if (!response.ok) {
          throw new Error("Failed to update image URL in database");
        }

        const result = await response.json();
        console.log("Image URL updated in database:", result);

        toast.success("Image uploaded and saved successfully");

        // Refresh the ad data
        queryClient.invalidateQueries({ queryKey: ["ad", id] });
      } catch (error) {
        console.error("Error updating image URL in database:", error);
        toast.error("Image uploaded but failed to save to database");
      }
    },
    onError: (error) => {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Create a complete data object with all fields explicitly included
    const dataToSubmit = {
      title: formData.title,
      companyName: formData.companyName,
      linkUrl: formData.linkUrl,
      imageUrl: formData.imageUrl,
      category: formData.category,
      regionId: formData.regionId,
      categoryType: formData.categoryType,
      description: formData.description,
      targetedBeaches: formData.targetedBeaches, // Include targeted beaches
    };

    console.log("Submitting data:", dataToSubmit);

    updateAdMutation.mutate(dataToSubmit);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    console.log("Uploading file:", file.name); // Add logging
    uploadImageMutation.mutate(file);
  };

  // Toggle between local and adventure category types
  const toggleCategoryType = (type: "local" | "adventure") => {
    setFormData((prev) => ({
      ...prev,
      categoryType: type,
      category: "", // Reset category when switching types
    }));
  };

  // Add a handler for toggling beach selection
  const toggleBeachSelection = (beachId: string) => {
    setFormData((prev) => {
      const isSelected = prev.targetedBeaches.includes(beachId);

      if (isSelected) {
        // Remove beach if already selected
        return {
          ...prev,
          targetedBeaches: prev.targetedBeaches.filter((id) => id !== beachId),
        };
      } else {
        // Add beach if not selected
        return {
          ...prev,
          targetedBeaches: [...prev.targetedBeaches, beachId],
        };
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 font-primary">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Advertisement</h1>
          <p className="text-[var(--color-text-secondary)]">
            Update your advertisement details
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/ads">
            <Button variant="outline" size="default">
              Back To Your Ads
            </Button>
          </Link>
          <Link href={`/dashboard/ads/${id}`}>
            <Button variant="outline" size="default">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-[var(--color-bg-primary)] rounded-lg shadow-sm p-6 border border-[var(--color-border-light)]">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ad Title (optional)
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <input
                type="url"
                name="linkUrl"
                value={formData.linkUrl}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Enter a brief description of your advertisement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              {formData.imageUrl && (
                <div className="mb-2">
                  <img
                    src={formData.imageUrl}
                    alt="Ad preview"
                    className="h-40 object-cover rounded-md"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Ad Type</label>
              <div className="flex space-x-4 mb-4">
                <Button
                  type="button"
                  variant={
                    formData.categoryType === "local" ? "default" : "outline"
                  }
                  onClick={() => toggleCategoryType("local")}
                >
                  Local Services
                </Button>
                <Button
                  type="button"
                  variant={
                    formData.categoryType === "adventure"
                      ? "default"
                      : "outline"
                  }
                  onClick={() => toggleCategoryType("adventure")}
                >
                  Adventure Experiences
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a category</option>
                {formData.categoryType === "local"
                  ? // Local service categories
                    Object.entries(AD_CATEGORIES).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))
                  : // Adventure experience categories
                    Object.entries(ADVENTURE_AD_CATEGORIES).map(
                      ([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      )
                    )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <div className="relative">
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search regions..."
                    className="w-full p-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      if (regions) {
                        const filtered = regions.filter((region: any) =>
                          region.name.toLowerCase().includes(searchTerm)
                        );
                        setFilteredRegions(filtered);
                      }
                    }}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {filteredRegions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredRegions.map((region: any) => (
                      <div
                        key={region.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            regionId: region.id,
                          }));
                          setFilteredRegions([]);
                        }}
                      >
                        {region.name
                          .split(" ")
                          .map(
                            (word: string) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase()
                          )
                          .join(" ")}
                      </div>
                    ))}
                  </div>
                )}

                <select
                  name="regionId"
                  value={formData.regionId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select a region</option>
                  {regions?.map((region: any) => (
                    <option key={region.id} value={region.id}>
                      {region.name
                        .split(" ")
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.regionId && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Targeted Beaches
                </label>
                <div className="relative">
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Search beaches..."
                      className="w-full p-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={beachSearchTerm}
                      onChange={(e) => setBeachSearchTerm(e.target.value)}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {filteredBeaches.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredBeaches.map((beach: any) => (
                        <div
                          key={beach.id}
                          className={`p-2 hover:bg-gray-100 cursor-pointer flex items-center ${
                            formData.targetedBeaches.includes(beach.id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => toggleBeachSelection(beach.id)}
                        >
                          <input
                            type="checkbox"
                            checked={formData.targetedBeaches.includes(
                              beach.id
                            )}
                            onChange={() => {}}
                            className="mr-2"
                          />
                          {beach.name}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {beaches
                        .filter((beach: any) =>
                          formData.targetedBeaches.includes(beach.id)
                        )
                        .map((beach: any) => (
                          <div
                            key={beach.id}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                          >
                            {beach.name}
                            <button
                              type="button"
                              className="ml-1 text-blue-600 hover:text-blue-800"
                              onClick={() => toggleBeachSelection(beach.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      {formData.targetedBeaches.length === 0 && (
                        <p className="text-gray-500 text-sm">
                          No beaches selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                variant="default"
                isLoading={isSaving || uploadImageMutation.isPending}
                disabled={isSaving || uploadImageMutation.isPending}
                className="px-6 py-2"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
