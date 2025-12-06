"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/app/components/ImageUploader";
import { VideoUploader } from "@/app/components/VideoUploader";

interface Region {
  id: string;
  name: string;
  country: {
    id: string;
    name: string;
  };
}

export default function HiddenGemForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "", // Text description
    regionId: "",
    latitude: "",
    longitude: "",
    waveType: "BEACH_BREAK",
    difficulty: "INTERMEDIATE",
    images: [] as string[],
    videos: [] as { url: string; title: string; platform: string }[],
    // Optional fields with defaults
    crowdLevel: "Few",
    crimeLevel: "LOW",
    sharkRisk: "LOW",
  });

  // Fetch Regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch("/api/regions");
        if (res.ok) {
          const data = await res.json();
          setRegions(data);
        }
      } catch (err) {
        console.error("Failed to fetch regions", err);
      }
    };
    fetchRegions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Find selected region to get countryId/continent
      const selectedRegion = regions.find((r) => r.id === formData.regionId);
      if (!selectedRegion) {
        throw new Error("Please select a valid region");
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        regionId: formData.regionId,
        countryId: selectedRegion.country.id,
        continent: "Africa", // TODO: Get from region if available, otherwise hardcode for now
        coordinates: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude),
        },
        waveType: formData.waveType,
        difficulty: formData.difficulty,
        images: formData.images,
        videos: formData.videos,
        // Default technical fields
        optimalTide: { type: "RISING", level: "MID" }, // simplified defaults
        optimalSwellDirections: { min: 180, max: 270, cardinal: "SW" },
        swellSize: { min: 1, max: 3 },
        idealSwellPeriod: { min: 10, max: 14 },
        crimeLevel: formData.crimeLevel,
        sharkRisk: formData.sharkRisk,
        crowdLevel: formData.crowdLevel,
      };

      const res = await fetch("/api/hidden-gems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit hidden gem");
      }

      // Success
      router.push("/hidden-gems");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
        }));
      });
    }
  };

  const handleSetImages = (imgs: string[]) => setFormData({ ...formData, images: imgs });
  const handleSetVideos = (vids: any[]) => setFormData({ ...formData, videos: vids });

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">List a Hidden Gem</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Share a secret spot with the community.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spot Name</label>
            <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. Secret Cove"
            />
        </div>

        <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
                required
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Describe the wave, the vibe, and how to get there..."
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
            <select
                required
                name="regionId"
                value={formData.regionId}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
            >
                <option value="">Select a region</option>
                {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.country.name})</option>
                ))}
            </select>
        </div>

        <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">General Location</label>
             <input
                required
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. Near Cape Point"
             />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
            <input
                required
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
                placeholder="-34.12345"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
            <div className="flex gap-2">
                <input
                    required
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="18.12345"
                />
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Use Current Location"
                >
                    📍
                </button>
            </div>
        </div>
      </div>

      {/* Surf Details */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white pt-4 border-t border-gray-200 dark:border-gray-700">Surf Conditions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wave Type</label>
            <select
                name="waveType"
                value={formData.waveType}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
            >
                <option value="BEACH_BREAK">Beach Break</option>
                <option value="REEF_BREAK">Reef Break</option>
                <option value="POINT_BREAK">Point Break</option>
                <option value="RIVER_MOUTH">River Mouth</option>
                <option value="JETTY_BREAK">Jetty Break</option>
                <option value="SLAB">Slab</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
             <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-purple-500 focus:border-purple-500"
            >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
            </select>
        </div>
      </div>

      {/* Media */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white pt-4 border-t border-gray-200 dark:border-gray-700">Media</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photos</label>
              <ImageUploader images={formData.images} setImages={handleSetImages} maxImages={5} />
          </div>
          <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video (Optional)</label>
              <VideoUploader videos={formData.videos} setVideos={handleSetVideos} maxVideos={1} />
          </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Hidden Gem"}
          </button>
      </div>
    </form>
  );
}
