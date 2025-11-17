"use client";

import { useState } from "react";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { Button } from "@/app/components/ui/Button";

export default function TestAlertsPage() {
  const { data: session } = useBackendAuth();
  const user = session?.user;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessAlerts = async () => {
    if (!user?.id) {
      setError("Please sign in first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/alerts/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to process alerts"
        );
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestForceAlert = async () => {
    if (!user?.id) {
      setError("Please sign in first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use the backend-proxy to call the test-force endpoint
      // The backend-proxy will forward the request with authentication
      const response = await fetch(`/api/backend-proxy/api/alerts/test-force`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("[test-alerts] Force test error:", errorData);
        throw new Error(
          errorData.error ||
            errorData.message ||
            errorData.details ||
            `Failed to test alert (${response.status})`
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Test Alert Notifications</h1>
        <p className="text-gray-600">
          Please sign in to test alert notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md font-primary">
      <h1 className="text-2xl font-bold mb-4">Test Alert Notifications</h1>
      <p className="text-gray-600 mb-6">
        Test your alert notification system. Make sure you have at least one
        active alert configured.
      </p>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">
            1. Process Alerts (Check Conditions)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            This will check all your active alerts against current forecast
            conditions and send notifications if conditions match.
          </p>
          <Button
            onClick={handleProcessAlerts}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Processing..." : "Process Alerts"}
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            2. Force Test Alert (Send Email)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            This will force send a test notification email for your first active
            alert, regardless of conditions.
          </p>
          <Button
            onClick={handleTestForceAlert}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {loading ? "Sending..." : "Force Test Alert Email"}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-sm text-red-500">
              Note: The backend validation schema has been updated locally but
              needs to be deployed to production. The error should be resolved
              after deployment.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">Result:</h3>
            <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
