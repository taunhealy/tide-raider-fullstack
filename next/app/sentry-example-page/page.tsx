"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/Button";

export default function SentryExamplePage() {
  useEffect(() => {
    console.log("Sentry Example Page loaded");
  }, []);

  const triggerError = () => {
    console.log("Triggering error...");
    // @ts-ignore
    myUndefinedFunction();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-primary">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Sentry Verification</h1>
        <p className="text-gray-500 mb-8 text-sm font-medium">
          Click the button below to trigger a test error and verify your Sentry installation.
        </p>

        <Button 
          onClick={triggerError}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100"
        >
          Trigger Test Error
        </Button>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Instructions</p>
          <ol className="text-left text-[11px] text-gray-400 space-y-2 font-medium">
            <li>1. Ensure your dev server is running</li>
            <li>2. Click the button above</li>
            <li>3. Check your Sentry Dashboard for the error</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
