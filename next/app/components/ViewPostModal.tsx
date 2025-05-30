import { Story } from "@/app/types/stories";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface ViewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story;
}

export function ViewPostModal({ isOpen, onClose, story }: ViewPostModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-[21px] max-w-[540px] w-full bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          <div className="relative flex-1 overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="p-6">
              <div className="mb-6">
                <span className="text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] px-2 py-1 rounded font-secondary font-semibold uppercase __Montserrat_4bc053, __Montserrat_Fallback_4bc053, sans-serif">
                  {story.category}
                </span>
              </div>

              <h2 className="text-3xl font-semibold mb-4 text-[var(--color-text-primary)]">
                {story.title}
              </h2>

              <div className="text-sm text-[var(--color-text-secondary)] mb-6">
                By {story.author.name} •{" "}
                {new Date(story.createdAt).toLocaleDateString()}
              </div>

              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{story.details}</p>
              </div>

              {story.link && (
                <a
                  href={story.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-black hover:text-gray-200 mt-6"
                >
                  View Related Content
                </a>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
