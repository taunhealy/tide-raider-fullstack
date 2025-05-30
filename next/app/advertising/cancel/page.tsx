"use client";

import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
        </div>

        <h1 className="text-2xl font-bold mb-4 font-primary">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 mb-6 font-primary">
          Your ad creation process has been cancelled. No payment has been
          processed.
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
