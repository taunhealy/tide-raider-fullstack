"use client";

import { useEffect } from "react";

/**
 * GlobalErrorHandler - Catches and handles global JavaScript errors
 * This prevents external scripts (like share-modal.js) from crashing the app
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleError = (event: ErrorEvent) => {
      // Check if it's an error from an external script or unknown source
      const errorSource = event.filename || event.message || "";
      const isExternalScript =
        errorSource.includes("share-modal") ||
        errorSource.includes("widget") ||
        errorSource.includes("third-party") ||
        (!errorSource.includes(window.location.origin) &&
          !errorSource.includes("localhost"));

      if (isExternalScript) {
        // Log the error but don't let it crash the app
        console.warn(
          "[GlobalErrorHandler] Caught external script error:",
          event.message,
          "Source:",
          errorSource
        );
        // Prevent the error from propagating
        event.preventDefault();
        return false;
      }

      // For other errors, check if it's a null reference error
      if (
        event.message?.includes("Cannot read properties of null") ||
        event.message?.includes("addEventListener")
      ) {
        const isNullReference = event.message?.includes(
          "Cannot read properties of null"
        );
        if (isNullReference) {
          console.warn(
            "[GlobalErrorHandler] Caught null reference error:",
            event.message,
            "Source:",
            errorSource
          );
          // Prevent the error from propagating
          event.preventDefault();
          return false;
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage =
        event.reason?.message || event.reason?.toString() || "";

      // Check if it's from an external script
      if (
        errorMessage.includes("share-modal") ||
        errorMessage.includes("widget") ||
        (!event.reason?.stack?.includes(window.location.origin) &&
          !event.reason?.stack?.includes("localhost"))
      ) {
        console.warn(
          "[GlobalErrorHandler] Caught unhandled promise rejection from external script:",
          errorMessage
        );
        // Prevent the error from propagating
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError, true); // Use capture phase
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return null;
}
