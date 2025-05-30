"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import * as Avatar from "@radix-ui/react-avatar";
import { Button } from "@/app/components/ui/Button";
import Textarea from "@/app/components/ui/textarea";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
}

export default function CommentThread({ logEntryId }: { logEntryId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [logEntryId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/comments?entityId=${logEntryId}&entityType=LogEntry`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: newComment,
          entityId: logEntryId,
          entityType: "LogEntry",
        }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <Avatar.Root className="h-10 w-10 rounded-full overflow-hidden">
                <Avatar.Image
                  src={comment.user.image || ""}
                  alt={comment.user.name}
                  className="h-full w-full object-cover rounded-full"
                />
                <Avatar.Fallback className="h-full w-full flex items-center justify-center rounded-full bg-gray-100">
                  {comment.user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-primary text-sm font-medium">
                    {comment.user.name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {format(
                      new Date(comment.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-left text-gray-500 py-4">No comments yet.</p>
      )}

      {session ? (
        <form onSubmit={handleSubmit} className="mt-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px] font-primary"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            className="mt-2"
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Comment"
            )}
          </Button>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-600 font-primary">
            Please sign in to leave a comment
          </p>
          <Button
            className="mt-2"
            onClick={() => (window.location.href = "/api/auth/signin")}
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
}
