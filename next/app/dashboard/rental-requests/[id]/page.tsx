"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequestStatusBadge } from "@/app/components/requests/RequestStatusBadge";
import { RequestDetails } from "@/app/components/requests/RequestDetails";
import { RequestChat } from "@/app/components/requests/RequestChat";
import type {
  RentalRequestWithRelations,
  RentalMessageWithSender,
} from "@/app/types/rentals";

export default function RentalRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<RentalRequestWithRelations | null>(
    null
  );
  const [messages, setMessages] = useState<RentalMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const isOwner = session?.user?.id === request?.ownerId;
  const isRenter = session?.user?.id === request?.renterId;

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/rental-requests/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch request data");
        }

        const data = await response.json();
        setRequest(data.request);
        setMessages(data.messages);
      } catch (err) {
        setError("Error loading request details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequestData();
  }, [id]);

  const handleStatusUpdate = async (
    newStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED"
  ) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/rental-requests/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update request status");
      }

      const updatedRequest = await response.json();
      setRequest(updatedRequest);
      // You could add a toast notification here
    } catch (err) {
      console.error("Error updating request status:", err);
      // You could add a toast notification here
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch(
        `/api/rental-requests/${id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage = await response.json();
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      // You could add a toast notification here
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 font-primary">Loading...</div>;
  }

  if (error || !request) {
    return (
      <div className="container mx-auto p-4 font-primary">
        Error: {error || "Request not found"}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="mb-6">
        <Link
          href="/dashboard/rental-requests"
          className="text-blue-600 hover:underline flex items-center"
        >
          ← Back to Requests
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold">Rental Request</h1>
              <RequestStatusBadge status={request.status} />
            </div>

            <RequestDetails request={request} />

            {/* Request Actions */}
            {isOwner && request.status === "PENDING" && (
              <div className="flex gap-4 mt-6 border-t pt-4">
                <button
                  onClick={() => handleStatusUpdate("APPROVED")}
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? "Processing..." : "Accept"}
                </button>
                <button
                  onClick={() => handleStatusUpdate("REJECTED")}
                  disabled={actionLoading}
                  className="btn-secondary"
                >
                  {actionLoading ? "Processing..." : "Decline"}
                </button>
              </div>
            )}

            {isRenter && request.status === "PENDING" && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={() => handleStatusUpdate("CANCELLED")}
                  disabled={actionLoading}
                  className="btn-secondary"
                >
                  {actionLoading ? "Processing..." : "Cancel Request"}
                </button>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <RequestChat
              messages={messages}
              requestId={id}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Request Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className="bg-black rounded-full h-4 w-4"></div>
                  <div className="h-full w-0.5 bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-medium">Request Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {request.status !== "PENDING" && (
                <div className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`rounded-full h-4 w-4 ${
                        request.status === "APPROVED"
                          ? "bg-green-500"
                          : request.status === "REJECTED"
                            ? "bg-red-500"
                            : request.status === "CANCELLED"
                              ? "bg-gray-500"
                              : "bg-blue-500"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <p className="font-medium">
                      Request{" "}
                      {request.status === "APPROVED"
                        ? "Accepted"
                        : request.status === "REJECTED"
                          ? "Declined"
                          : request.status === "CANCELLED"
                            ? "Cancelled"
                            : request.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-black rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <p className="mb-4">
              If you have any issues with this rental, please contact our
              support team.
            </p>
            <Link href="/contact" className="btn-primary w-full text-center">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
