"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) return this.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-3xl border border-red-100 shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Signal Interrupted</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-8 font-medium">
            A client-side exception occurred while processing this report. Our engineers have been alerted.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-black hover:bg-slate-800 text-white font-bold uppercase tracking-widest h-12 rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Connection
            </Button>
            <Button 
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full border-slate-200 text-slate-500 font-bold uppercase tracking-widest h-12 rounded-xl"
            >
              Try Again
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-w-full">
              <p className="text-[10px] font-mono text-red-600">{this.state.error?.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
