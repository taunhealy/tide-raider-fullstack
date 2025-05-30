"use client";

import { useState } from "react";

interface ContactOwnerButtonProps {
  ownerEmail: string;
  ownerName: string;
  isSignedIn?: boolean;
  isSubscriber?: boolean;
  isTrialing?: boolean;
}

export function ContactOwnerButton({
  ownerEmail,
  ownerName,
  isSignedIn = false,
  isSubscriber = false,
  isTrialing = false,
}: ContactOwnerButtonProps) {
  const [isEmailVisible, setIsEmailVisible] = useState(false);
  const [showAuthMessage, setShowAuthMessage] = useState(false);

  const canViewEmail = isSignedIn && (isSubscriber || isTrialing);

  const handleClick = () => {
    if (canViewEmail) {
      setIsEmailVisible(true);
      setShowAuthMessage(false);
    } else {
      setShowAuthMessage(true);
    }
  };

  return (
    <div className="font-primary">
      <button
        onClick={handleClick}
        className="btn-tertiary px-4 py-2 text-[16px] leading-6"
      >
        Contact Owner
      </button>

      {/* Auth Message */}
      {showAuthMessage && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-left">
          <p className="text-[var(--color-text-primary)] text-sm">
            {!isSignedIn
              ? "Please sign in to contact the owner."
              : "You need an active subscription to contact owners."}
          </p>
        </div>
      )}

      {/* Email Display */}
      {isEmailVisible && canViewEmail && (
        <div className="mt-2 space-y-2">
          <p className="text-[var(--color-text-primary)]">
            Contact {ownerName} at:
          </p>
          <a
            href={`mailto:${ownerEmail}`}
            className="text-[var(--color-tertiary)] hover:opacity-90 transition-colors"
          >
            {ownerEmail}
          </a>
        </div>
      )}
    </div>
  );
}
