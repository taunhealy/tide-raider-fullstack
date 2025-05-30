"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const adId = searchParams.get("adId");
  const isMock = searchParams.get("mock") === "true";
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    // Trigger confetti on load
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // If this is a mock flow, we're already done
    if (isMock) {
      setStatus("success");
      return;
    }

    // Otherwise, capture the real PayPal payment
    const capturePayment = async () => {
      try {
        const response = await fetch("/api/advertising/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId }),
        });

        if (response.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error capturing payment:", error);
        setStatus("error");
      }
    };

    if (adId) {
      capturePayment();
    }
  }, [adId, isMock]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {status === "processing" ? (
            <svg
              className="w-8 h-8 text-green-500 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : status === "success" ? (
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-4 font-primary">
          {status === "processing"
            ? "Processing your payment..."
            : status === "success"
              ? "Payment Successful!"
              : "Payment Processing Error"}
        </h1>

        <p className="text-gray-600 mb-6 font-primary">
          {status === "processing"
            ? "Please wait while we confirm your payment..."
            : status === "success"
              ? "Your ad has been successfully created and will be reviewed shortly."
              : "There was an issue processing your payment. Please contact support."}
        </p>

        <div className="mt-8">
          <Link
            href="/advertising"
            className="px-6 py-3 bg-black text-white rounded-md hover:bg-black transition-colors font-primary"
          >
            Return to Advertising
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
