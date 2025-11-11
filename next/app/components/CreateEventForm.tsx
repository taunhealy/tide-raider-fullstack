"use client";

import { useState, useMemo } from "react";
import { useBeach } from "@/app/context/BeachContext";

export default function CreateEventForm() {
  const { beaches } = useBeach();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    country: "",
    region: "",
    startTime: "",
    link: "",
  });

  // Extract unique countries and regions from database beaches
  const { countries, regionsByCountry } = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(
        beaches.map((beach) =>
          typeof beach.country === "string"
            ? beach.country
            : beach.country?.id || beach.countryId || ""
        )
      )
    ).sort();
    const regionMap = beaches.reduce(
      (acc, beach) => {
        const countryKey =
          typeof beach.country === "string"
            ? beach.country
            : beach.country?.id || beach.countryId || "";
        if (!acc[countryKey]) {
          acc[countryKey] = new Set();
        }
        const regionKey =
          typeof beach.region === "string"
            ? beach.region
            : beach.region?.id || beach.regionId || "";
        acc[countryKey].add(regionKey);
        return acc;
      },
      {} as Record<string, Set<string>>
    );

    // Convert Sets to sorted arrays
    const regionsByCountry = Object.fromEntries(
      Object.entries(regionMap).map(([country, regions]) => [
        country,
        Array.from(regions).sort(),
      ])
    );

    return { countries: uniqueCountries, regionsByCountry };
  }, [beaches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Reset form and show success message
        setFormData({
          title: "",
          description: "",
          country: "",
          region: "",
          startTime: "",
          link: "",
        });
        alert("Event created successfully!");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          title="Title"
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          title="description"
          required
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <select
            required
            title="select country"
            value={formData.country}
            onChange={(e) => {
              setFormData({
                ...formData,
                country: e.target.value,
                region: "", // Reset region when country changes
              });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Region
          </label>
          <select
            required
            title="select region"
            value={formData.region}
            onChange={(e) =>
              setFormData({ ...formData, region: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
            disabled={!formData.country}
          >
            <option value="">Select Region</option>
            {formData.country &&
              regionsByCountry[formData.country]?.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Time
          </label>
          <input
            title="input start time"
            type="datetime-local"
            required
            value={formData.startTime}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Link (optional)
        </label>
        <input
          type="url"
          value={formData.link}
          onChange={(e) => setFormData({ ...formData, link: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
          placeholder="https://..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-[var(--color-tertiary)] text-white py-2 px-4 rounded-md hover:bg-[var(--color-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)] focus:ring-offset-2"
      >
        Create Event
      </button>
    </form>
  );
}
