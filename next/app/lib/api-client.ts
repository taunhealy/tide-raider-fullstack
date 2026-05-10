/**
 * API Client — Uses Next.js proxy to communicate with backend
 * This ensures cookies are properly forwarded server-side
 */

// Use Next.js API proxy on the same domain (no CORS issues)
const API_BASE = "/api/backend";

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

  // Remove /api prefix if present (proxy will add it)
  const cleanEndpoint = endpoint.startsWith("/api")
    ? endpoint.substring(4)
    : endpoint;

  const url = `${API_BASE}${cleanEndpoint}`;
  console.log(`[apiRequest] ${options.method || "GET"} ${url}`);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // Include cookies for session
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const error = new Error(
        errorData.error || errorData.message || "Request failed"
      ) as Error & { response?: { data?: any; status?: number } };

      error.response = { data: errorData, status: response.status };

      if (errorData.error === "Validation failed" && errorData.details) {
        const details = errorData.details
          .map((d: any) => `${d.path}: ${d.message}`)
          .join(", ");
        error.message = `Validation failed: ${details}`;
      }

      throw error;
    }

    return await response.json();
  } catch (error: any) {
    // Only log actual failures, not missing resources (404)
    if (error?.response?.status !== 404) {
      console.error(`API request failed: ${endpoint}`, error);
    }
    throw error;
  }
}

// All API methods — now go directly to your EU backend
export const api = {
  // Beaches
  getBeaches: async (regionId?: string) => {
    const query = regionId ? `?regionId=${encodeURIComponent(regionId)}` : "";
    return apiRequest<{ beaches: any[] }>(`/api/beaches${query}`);
  },

  getBeach: async (name: string) => {
    return apiRequest<{ beach: any }>(
      `/api/beaches/${encodeURIComponent(name)}`
    );
  },

  // Alerts
  getAlerts: async (params?: {
    region?: string;
    logEntryId?: string;
    starRatings?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.region) queryParams.append("region", params.region);
    if (params?.logEntryId) queryParams.append("logEntryId", params.logEntryId);
    if (params?.starRatings) queryParams.append("starRatings", "true");
    const query = queryParams.toString();
    return apiRequest<any[]>(`/api/alerts${query ? `?${query}` : ""}`);
  },

  getAlert: async (id: string) => apiRequest<any>(`/api/alerts/${id}`),
  createAlert: async (data: any) =>
    apiRequest<any>("/api/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAlert: async (id: string, data: any) =>
    apiRequest<any>(`/api/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  patchAlert: async (id: string, data: any) =>
    apiRequest<any>(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAlert: async (id: string) =>
    apiRequest<{ success: boolean }>(`/api/alerts/${id}`, { method: "DELETE" }),
  notifyAlerts: async (userId: string) =>
    apiRequest<any>("/api/alerts/notify", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  // Logs
  getLogs: async () => apiRequest<any[]>("/api/logs"),
  getLog: async (id: string) => apiRequest<any>(`/api/logs/${id}`),
  createLog: async (data: any) =>
    apiRequest<any>("/api/logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Raid Logs
  getRaidLogs: async (params?: any) => {
    const queryParams = new URLSearchParams();
    Object.keys(params || {}).forEach((key) => {
      const value = params[key];
      if (Array.isArray(value)) queryParams.append(key, value.join(","));
      else if (value !== undefined && value !== null)
        queryParams.append(key, value.toString());
    });
    const query = queryParams.toString();
    return apiRequest<any>(`/api/raid-logs${query ? `?${query}` : ""}`);
  },

  createRaidLog: async (data: any) =>
    apiRequest<any>("/api/raid-logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRaidLog: async (data: any) =>
    apiRequest<any>("/api/raid-logs", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteRaidLog: async (id: string) =>
    apiRequest<any>(`/api/raid-logs?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  getRaidLogForecast: async (region: string, date: string) =>
    apiRequest<any>(
      `/api/raid-logs/forecast?region=${encodeURIComponent(region)}&date=${encodeURIComponent(date)}`
    ),
  getUserRaidLogs: async (userId: string) =>
    apiRequest<any[]>(`/api/raid-logs/user/${userId}`),

  // Forecast
  getForecast: async (
    regionId: string,
    forecastDate?: string,
    source?: "WINDFINDER" | "WINDFINDER_SUPER" | "WINDGURU" | "WINDY" | "TIDE_RAIDER",
    timeSlot?: string
  ) => {
    const params = new URLSearchParams({ regionId });
    if (forecastDate) params.append("forecastDate", forecastDate);
    if (source) params.append("source", source);
    if (timeSlot) params.append("timeSlot", timeSlot);

    try {
      return await apiRequest<any>(`/api/forecast?${params.toString()}`);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.warn(`No forecast data for ${regionId}`);
        return null;
      }
      throw error;
    }
  },

  // Filtered Beaches
  getFilteredBeaches: async (params?: any) => {
    const queryParams = new URLSearchParams();
    Object.keys(params || {}).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "")
        queryParams.append(
          key,
          Array.isArray(value) ? value.join(",") : value.toString()
        );
    });
    const query = queryParams.toString();
    return apiRequest<any>(`/api/filtered-beaches${query ? `?${query}` : ""}`);
  },

  getGlobalBeaches: async (params?: any) => {
    const queryParams = new URLSearchParams();
    Object.keys(params || {}).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "")
        queryParams.append(
          key,
          Array.isArray(value) ? value.join(",") : value.toString()
        );
    });
    const query = queryParams.toString();
    return apiRequest<any>(`/api/global-beaches${query ? `?${query}` : ""}`);
  },

  // Regions — NOW GOES THROUGH BACKEND (fixed!)
  getRegions: async () => {
    return apiRequest<any[]>("/api/regions");
  },

  // User
  getUser: async (userId: string) => apiRequest<any>(`/api/user/${userId}`),
  getCurrentUser: async () => apiRequest<any>("/api/user/current"),

  // Notifications
  getNotifications: async () => apiRequest<any[]>("/api/notifications"),
  getNotificationCount: async () =>
    apiRequest<{ count: number }>("/api/notifications/count"),
  markNotificationRead: async (id: string) =>
    apiRequest<any>(`/api/notifications/${id}`, { method: "PUT" }),
  markAllNotificationsRead: async () =>
    apiRequest<any>("/api/notifications/read", { method: "PUT" }),

  // Subscriptions & Sponsors
  getSubscriptionStatus: async () =>
    apiRequest<any>("/api/subscriptions/status"),
  getSponsors: async () => apiRequest<any[]>("/api/sponsors"),

  // Health
  health: async () =>
    apiRequest<{ status: string; timestamp: string }>("/health"),

  // Raw request
  request: apiRequest,
};

export default api;
