"use client";

import { useState, useEffect, useMemo } from "react";
import { useBeach } from "@/app/context/BeachContext";
import { format } from "date-fns";
import { Event } from "../types/events";
import { useSession } from "next-auth/react";

export default function EventsSidebar() {
  const { beaches } = useBeach();
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    country: "",
    region: "",
    startTime: "",
    link: "",
  });

  const { data: session } = useSession();

  const { countries, regionsByCountry } = useMemo(() => {
    if (!beaches || beaches.length === 0) {
      return { countries: [], regionsByCountry: {} };
    }

    const uniqueCountries = Array.from(
      new Set(beaches.map((beach) => beach.country))
    ).sort();

    const regionMap = beaches.reduce(
      (acc, beach) => {
        if (!acc[beach.country]) {
          acc[beach.country] = new Set();
        }
        acc[beach.country].add(beach.region.name);
        return acc;
      },
      {} as Record<string, Set<string>>
    );

    const regionsByCountry = Object.fromEntries(
      Object.entries(regionMap).map(([country, regions]) => [
        country,
        Array.from(regions).sort(),
      ])
    );

    return { countries: uniqueCountries, regionsByCountry };
  }, [beaches]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      // Ensure data is an array
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  };

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
        resetForm();
        setShowForm(false);
        fetchEvents(); // Refresh events list
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      country: "",
      region: "",
      startTime: "",
      link: "",
    });
  };

  const handleDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 ">
        <div className="flex flex-col items-center gap-4">
          <h6 className="heading-6 text-gray-900">Travel Video Premieres</h6>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-small bg-[var(--color-bg-tertiary)] text-white px-4 py-2 rounded-md hover:opacity-90"
          >
            {showForm ? "Cancel" : "Add Event"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
              />
            </div>

            <div>
              <label className="block text-small text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  required
                  value={formData.country}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      country: e.target.value,
                      region: "", // Reset region when country changes
                    });
                  }}
                  className="mt-2 block w-full px-4 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  required
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                  className="mt-2 block w-full px-4 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link (optional)
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                className="mt-2 block w-full px-4 py-2 text-sm rounded-md border-gray-300 shadow-sm focus:border-[var(--color-tertiary)] focus:ring-[var(--color-tertiary)]"
                placeholder="https://..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--color-bg-tertiary)] text-white text-sm py-3 px-6 rounded-md hover:opacity-90 transition-opacity"
            >
              Create Event
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-200">
        {Array.isArray(events) && events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="p-6">
              <h3 className="font-medium text-gray-900">{event.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{event.description}</p>
              <div className="text-sm text-gray-500 mt-4">
                <p>{`${event.country}, ${event.region}`}</p>
                <p>{format(new Date(event.startTime), "PPP")}</p>
              </div>
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-bg-tertiary)] hover:underline text-sm mt-4 block"
                >
                  Learn more
                </a>
              )}
              {session?.user?.id === event.userId && (
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-grey-600 hover:text-red-600 text-sm mt-2 block"
                >
                  Delete Event
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center p-6">
            <p className="text-small text-gray-800 mb-4">No Events Yet 🎥</p>
            <p className="text-small text-gray-600">
              Check back later for upcoming video premieres
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
