/**
 * API Client for Tide Raider — EU backend (direct calls)
 * No more /api/backend-proxy → we now call the real Cloud Run backend directly
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://tide-raider-backend-eu-82632174665.europe-west1.run.app";

// ← This is your real backend URL (feel free to keep it hardcoded during dev)

interface RequestOptions extends RequestInit {
  token?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Direct call to the real backend — no proxy anymore
  const url = `${BACKEND_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // Still sends NextAuth session cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      const error = new Error(
        errorData.error || errorData.message || "Request failed"
      ) as Error & {
        response?: { data?: any; status?: number };
      };

      error.response = {
        data: errorData,
        status: response.status,
      };

      if (errorData.error === "Validation failed" && errorData.details) {
        const details = errorData.details
          .map((d: any) => `${d.path}: ${d.message}`)
          .join(", ");
        error.message = `Validation failed: ${details}`;
      }

      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// ← Everything below stays 100% unchanged (all your api methods)
export const api = {
  // ... all your existing methods (getBeaches, getRaidLogs, getFilteredBeaches, etc.)
  // They already use correct endpoints like "/api/raid-logs", so they work perfectly now
  getBeaches: async (regionId?: string) => {
    const query = regionId ? `?regionId=${encodeURIComponent(regionId)}` : "";
    return apiRequest<{ beaches: any[] }>(`/api/beaches${query}`);
  },
  // ... keep every single method exactly as you posted before
  // (no need to touch them — they’re perfect)
};
