"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/Button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { BeachSearchInput } from "@/app/components/ui/BeachSearchInput";
import { Input } from "@/app/components/ui/input";
import type { Beach } from "@/app/types/beaches";
import { format } from "date-fns";

interface Squad {
  id: string;
  name: string;
  members: Array<{
    id: string;
    phoneNumber: string;
    name?: string | null;
  }>;
}

interface BroadcastFormProps {
  squad: Squad | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BroadcastForm({
  squad,
  onClose,
  onSuccess,
}: BroadcastFormProps) {
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate default message when beach or date/time changes
  useEffect(() => {
    if (selectedBeach && scheduledDate && scheduledTime) {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const formattedDate = format(dateTime, "MMMM d, yyyy");
      const formattedTime = format(dateTime, "h:mm a");

      const defaultMessage = `Yo! I'm heading out to ${selectedBeach.name} at ${formattedDate}, ${formattedTime}. Hopefully see you there! (This is an automated broadcast from www.tideraider.com)`;
      setMessage(defaultMessage);
    }
  }, [selectedBeach, scheduledDate, scheduledTime]);

  // Set default date/time to tomorrow at 6 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);

    setScheduledDate(tomorrow.toISOString().split("T")[0]);
    setScheduledTime("06:00");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!squad) {
      alert("No squad selected");
      setIsSubmitting(false);
      return;
    }

    if (!selectedBeach) {
      alert("Please select a beach");
      setIsSubmitting(false);
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      alert("Please select a date and time");
      setIsSubmitting(false);
      return;
    }

    if (!message.trim()) {
      alert("Please enter a message");
      setIsSubmitting(false);
      return;
    }

    try {
      // Combine date and time into ISO 8601 format
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const payload = {
        squadId: squad.id,
        beachId: selectedBeach.id,
        beachName: selectedBeach.name,
        message: message.trim(),
        scheduledAt,
      };

      const response = await fetch("/api/squads/broadcasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send broadcast");
      }

      const data = await response.json();
      alert(
        `Broadcast sent! ${data.sendResult.success} message(s) sent successfully.`
      );
      onSuccess();
    } catch (error) {
      console.error("Error sending broadcast:", error);
      alert(error instanceof Error ? error.message : "Failed to send broadcast");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!squad) {
    return (
      <div className="p-6">
        <p className="text-gray-600 font-primary">No squad selected</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-primary font-semibold mb-2 text-[var(--color-text-primary)]">
        New Broadcast
      </h2>
      <p className="text-sm text-gray-600 mb-6 font-primary">
        Sending to: <strong>{squad.name}</strong> ({squad.members.length} member
        {squad.members.length !== 1 ? "s" : ""})
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Select Beach</Label>
          <p className="text-sm text-gray-600 mb-3 font-primary">
            Search and select the beach you're heading to
          </p>
          <BeachSearchInput
            selectedBeach={selectedBeach}
            onBeachSelect={setSelectedBeach}
            placeholder="Search beaches..."
            showSelectedBadge={true}
            minSearchLength={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <p className="text-sm text-gray-600 mb-3 font-primary">
            Customize your message (default message is auto-generated)
          </p>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            required
            rows={6}
            className="mt-1 font-primary"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Broadcast"}
          </Button>
        </div>
      </form>
    </div>
  );
}



