"use client";

import { useState } from "react";
import { Beach } from "@/app/types/beaches";
import { Button } from "@/app/components/ui/Button";
import { cn } from "@/app/lib/utils";
import { Inter } from "next/font/google";
import { Check, Calendar, Search, ChevronDown } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

interface FeedbackProps {
  beaches: Beach[];
}

interface Condition {
  id: string;
  title: string;
  isAccurate: boolean;
}

export default function Feedback({ beaches }: FeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [improvements, setImprovements] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "1", title: "Wind Direction", isAccurate: true },
    { id: "2", title: "Wind Speed", isAccurate: true },
    { id: "3", title: "Swell Height", isAccurate: true },
    { id: "4", title: "Swell Direction", isAccurate: true },
    { id: "5", title: "Wave Quality", isAccurate: true },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeach) return;

    console.log("Selected beach:", selectedBeach);

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          beach: { name: selectedBeach.name },
          conditions: conditions.filter((c) => !c.isAccurate),
          improvements,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mt-6">
      {/* Dropdown Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn("w-full px-9 py-6", "flex items-start justify-start")}
      >
        <h6 className="heading-6 text-gray-800 text-start">
          Surf Conditions Feedback
        </h6>
        <ChevronDown
          className={cn(
            "w-5 h-5 transition-transform duration-200",
            isOpen ? "transform rotate-180" : ""
          )}
        />
      </button>

      {/* Dropdown Content */}
      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          "overflow-hidden",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-9 pb-9">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <label
                className={cn(
                  "block text-[14px] font-medium text-[var(--color-text-secondary)]",
                  inter.className
                )}
              >
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-3",
                    "border border-gray-200 rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent",
                    "text-[14px] text-[var(--color-text-primary)]"
                  )}
                />
              </div>
            </div>

            {/* Beach Selection */}
            <div className="space-y-2 relative">
              <label
                className={cn(
                  "block text-[14px] font-medium text-[var(--color-text-secondary)]",
                  inter.className
                )}
              >
                Beach
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Search for a beach..."
                  className={cn(
                    "w-full pl-10 pr-4 py-3",
                    "border border-gray-200 rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent",
                    "text-[14px] text-[var(--color-text-primary)]"
                  )}
                />
              </div>

              {/* Beach Suggestions */}
              {showSuggestions && searchQuery && (
                <div
                  className={cn(
                    "absolute z-10 w-full mt-1",
                    "bg-white border border-gray-200 rounded-lg shadow-lg",
                    "max-h-[240px] overflow-auto"
                  )}
                >
                  {filteredBeaches.map((beach) => (
                    <div
                      key={beach.id}
                      className={cn(
                        "px-4 py-3",
                        "hover:bg-gray-50 cursor-pointer",
                        "text-[14px] text-[var(--color-text-primary)]",
                        "transition-colors duration-150"
                      )}
                      onClick={() => {
                        setSelectedBeach(beach);
                        setSearchQuery(beach.name);
                        setShowSuggestions(false);
                      }}
                    >
                      {beach.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <label
                className={cn(
                  "block text-[16px] font-medium text-[var(--color-text-secondary)] mb-2",
                  inter.className
                )}
              >
                Inaccurate Conditions
              </label>
              <div className="space-y-0 bg-gray-50 p-4 rounded-lg">
                {conditions.map((condition) => (
                  <div
                    key={condition.id}
                    className={cn(
                      "flex items-center gap-3 p-3",
                      "hover:bg-white rounded-lg cursor-pointer",
                      "transition-colors duration-150"
                    )}
                    onClick={() => {
                      setConditions(
                        conditions.map((c) =>
                          c.id === condition.id
                            ? { ...c, isAccurate: !c.isAccurate }
                            : c
                        )
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center",
                        "transition-colors duration-150",
                        condition.isAccurate
                          ? "bg-[var(--color-bg-tertiary)]"
                          : "border-2 border-gray-300 bg-white"
                      )}
                    >
                      {condition.isAccurate && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[14px] text-[var(--color-text-primary)]",
                        inter.className
                      )}
                    >
                      {condition.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements */}
            <div className="space-y-2">
              <label
                className={cn(
                  "block text-[16px] font-medium text-[var(--color-text-secondary)] mb-2",
                  inter.className
                )}
              >
                Improvements
              </label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Share your suggestions for improving our surf predictions..."
                className={cn(
                  "w-full px-4 py-3",
                  "border border-gray-200 rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent",
                  "text-[14px] text-[var(--color-text-primary)]",
                  "min-h-[144px] resize-none"
                )}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className={cn(
                "w-full h-[54px]",
                "text-[14px] font-medium",
                "bg-[var(--color-bg-tertiary)]",
                "transition-colors duration-150",
                (isSubmitting || isSubmitted) && "opacity-50"
              )}
            >
              {isSubmitting
                ? "Submitting..."
                : isSubmitted
                  ? "Thanks!"
                  : "Submit Feedback"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
