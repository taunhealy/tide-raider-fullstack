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
      const errorMessage = event.message || "";

      // Check for null reference errors with addEventListener (including share-modal.js)
      const isNullAddEventListenerError =
        (errorMessage.includes("Cannot read properties of null") ||
          errorMessage.includes("Cannot read property") ||
          errorMessage.includes("Cannot read")) &&
        (errorMessage.includes("addEventListener") ||
          errorSource.includes("share-modal") ||
          errorSource.includes("share-modal.js"));

      if (isNullAddEventListenerError || errorSource.includes("share-modal")) {
        // Log the error but don't let it crash the app
        console.warn(
          "[GlobalErrorHandler] Caught external script error:",
          errorMessage,
          "Source:",
          errorSource
        );
        // Prevent the error from propagating
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      // For other external script errors
      const isExternalScript =
        !errorSource.includes(window.location.origin) &&
        !errorSource.includes("localhost") &&
        !errorSource.startsWith("blob:") &&
        !errorSource.startsWith("data:") &&
        errorSource !== "";

      if (isExternalScript && errorMessage.includes("Cannot read properties")) {
        console.warn(
          "[GlobalErrorHandler] Caught external script null reference error:",
          errorMessage,
          "Source:",
          errorSource
        );
        event.preventDefault();
        event.stopPropagation();
        return false;
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
