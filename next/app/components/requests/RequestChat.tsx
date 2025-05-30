"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { format } from "date-fns";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string | Date;
  senderId: string;
  sender?: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface RequestChatProps {
  messages: ChatMessage[];
  requestId: string;
  onSendMessage: (content: string) => Promise<void>;
}

export function RequestChat({
  messages: initialMessages,
  requestId,
  onSendMessage,
}: RequestChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up Supabase real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("messages_channel")
      .on("broadcast", { event: "new-message" }, (payload) => {
        if (payload.payload.requestId === requestId) {
          setMessages((prev) => [...prev, payload.payload.message]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 font-primary">
      <div className="h-80 overflow-y-auto mb-4 p-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.senderId === session?.user?.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.senderId === session?.user?.id
                    ? "bg-blue-100 text-black"
                    : "bg-gray-100"
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.sender?.image &&
                    message.senderId !== session?.user?.id && (
                      <Image
                        src={message.sender.image}
                        alt={message.sender.name}
                        width={24}
                        height={24}
                        className="rounded-full mr-2"
                      />
                    )}
                  <span className="font-medium text-sm">
                    {message.senderId === session?.user?.id
                      ? "You"
                      : message.sender?.name}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {format(new Date(message.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
