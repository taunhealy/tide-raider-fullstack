"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { RentalMessageWithSender } from "@/app/types/rentals";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface RentalRequestChatProps {
  requestId: string;
  messages: RentalMessageWithSender[];
  currentUserId: string;
}

export function RentalRequestChat({
  requestId,
  messages: initialMessages,
  currentUserId,
}: RentalRequestChatProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt.toString(),
    }))
  );
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/rental-requests/${requestId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const sentMessage = await response.json();
      setMessages([...messages, sentMessage]);
      setNewMessage("");
    } catch (err: unknown) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Messages container */}
      <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.sender.id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {message.sender.image && (
                      <div
                        className={`flex-shrink-0 ${isCurrentUser ? "ml-2" : "mr-2"}`}
                      >
                        <Image
                          src={message.sender.image}
                          alt={message.sender.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                    )}

                    <div>
                      <div
                        className={`rounded-lg p-3 ${
                          isCurrentUser
                            ? "bg-blue-500 text-white rounded-tr-none"
                            : "bg-white border rounded-tl-none"
                        }`}
                      >
                        {message.content}
                      </div>

                      <div
                        className={`text-xs text-gray-500 mt-1 ${
                          isCurrentUser ? "text-right" : "text-left"
                        }`}
                      >
                        {format(new Date(message.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="mt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
