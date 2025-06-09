import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { LogEntry } from "@/app/types/raidlogs";
import Image from "next/image";
import { Star } from "lucide-react";

interface QuestLogModalProps {
  session: LogEntry;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestLogModal({
  session,
  isOpen,
  onClose,
}: QuestLogModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">
            Quest at {session.beachName}
          </DialogTitle>
        </DialogHeader>

        {session.imageUrl && (
          <div className="relative aspect-video w-full mb-6">
            <Image
              src={session.imageUrl}
              alt={`Quest at ${session.beachName}`}
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Star
                  key={rating}
                  className={`w-5 h-5 ${
                    rating <= (session.surferRating ?? 0)
                      ? "text-[var(--color-tertiary)] fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-gray-600">Date:</span>
            <p>{new Date(session.date).toLocaleDateString()}</p>
          </div>

          <div>
            <span className="text-gray-600">Surfer:</span>
            <p>{session.surferName}</p>
          </div>

          {session.comments && (
            <div>
              <span className="text-gray-600">Comments:</span>
              <p className="mt-1">{session.comments}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
