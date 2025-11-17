/**
 * API Client for communicating with the backend API
 * Uses Next.js API proxy to handle cross-domain authentication
 *
 * The proxy route (/api/backend-proxy) handles:
 * - Getting NextAuth session tokens from cookies
 * - Forwarding requests to the backend with proper auth headers
 * - No cross-domain cookie issues
 */

// Use the proxy route instead of direct backend URL
// The proxy will forward to the actual backend
const PROXY_BASE_URL = "/api/backend-proxy";

interface RequestOptions extends RequestInit {
  // Token is no longer needed - proxy handles it automatically
  // Keeping for backward compatibility but it's ignored
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

  // Build URL through proxy
  // endpoint should be like "/api/alerts" -> proxy forwards to backend
  const url = `${PROXY_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // Include cookies for NextAuth session (for proxy)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || "Request failed");
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Token helper no longer needed - proxy handles authentication automatically
// Keeping for backward compatibility but it's not used
function getAuthToken(): string | null {
  // Proxy handles auth automatically, so we don't need to extract tokens
  return null;
}

// API methods
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

  getAlert: async (id: string) => {
    return apiRequest<any>(`/api/alerts/${id}`);
  },

  createAlert: async (data: any) => {
    return apiRequest<any>("/api/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateAlert: async (id: string, data: any) => {
    return apiRequest<any>(`/api/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  patchAlert: async (id: string, data: any) => {
    return apiRequest<any>(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteAlert: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/api/alerts/${id}`, {
      method: "DELETE",
    });
  },

  notifyAlerts: async (userId: string) => {
    return apiRequest<{ success: boolean; processed: any }>(
      "/api/alerts/notify",
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      }
    );
  },

  // Logs
  getLogs: async () => {
    return apiRequest<any[]>("/api/logs");
  },

  getLog: async (id: string) => {
    return apiRequest<any>(`/api/logs/${id}`);
  },

  createLog: async (data: any) => {
    return apiRequest<any>("/api/logs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Raid Logs
  getRaidLogs: async (params?: {
    id?: string;
    beaches?: string[];
    regions?: string[];
    regionId?: string;
    countries?: string[];
    minRating?: number;
    maxRating?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    isPrivate?: boolean;
    userId?: string;
    beachId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append("id", params.id);
    if (params?.beaches?.length)
      queryParams.append("beaches", params.beaches.join(","));
    if (params?.regions?.length)
      queryParams.append("regions", params.regions.join(","));
    if (params?.regionId) queryParams.append("regionId", params.regionId);
    if (params?.countries?.length)
      queryParams.append("countries", params.countries.join(","));
    if (params?.minRating !== undefined)
      queryParams.append("minRating", params.minRating.toString());
    if (params?.maxRating !== undefined)
      queryParams.append("maxRating", params.maxRating.toString());
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.isPrivate !== undefined)
      queryParams.append("isPrivate", params.isPrivate.toString());
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.beachId) queryParams.append("beachId", params.beachId);
    const query = queryParams.toString();
    return apiRequest<{
      entries: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/raid-logs${query ? `?${query}` : ""}`);
  },

  createRaidLog: async (data: any) => {
    return apiRequest<any>("/api/raid-logs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateRaidLog: async (data: any) => {
    return apiRequest<any>("/api/raid-logs", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteRaidLog: async (id: string) => {
    return apiRequest<{ message: string }>("/api/raid-logs", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  },

  getRaidLogForecast: async (region: string, date: string) => {
    return apiRequest<any>(
      `/api/raid-logs/forecast?region=${encodeURIComponent(region)}&date=${encodeURIComponent(date)}`
    );
  },

  getUserRaidLogs: async (userId: string) => {
    return apiRequest<any[]>(`/api/raid-logs/user/${userId}`);
  },

  // Forecast
  getForecast: async (regionId: string) => {
    return apiRequest<any>(
      `/api/forecast?regionId=${encodeURIComponent(regionId)}`
    );
  },

  // Filtered Beaches
  getFilteredBeaches: async (params?: {
    regionId?: string;
    searchQuery?: string;
    optimalTide?: string;
    waveType?: string;
    crimeLevel?: string;
    bestSeasons?: string;
    difficulty?: string;
    hazards?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.regionId) queryParams.append("regionId", params.regionId);
    if (params?.searchQuery)
      queryParams.append("searchQuery", params.searchQuery);
    if (params?.optimalTide)
      queryParams.append("optimalTide", params.optimalTide);
    if (params?.waveType) queryParams.append("waveType", params.waveType);
    if (params?.crimeLevel) queryParams.append("crimeLevel", params.crimeLevel);
    if (params?.bestSeasons)
      queryParams.append("bestSeasons", params.bestSeasons);
    if (params?.difficulty) queryParams.append("difficulty", params.difficulty);
    if (params?.hazards) queryParams.append("hazards", params.hazards);
    const query = queryParams.toString();
    return apiRequest<{
      beaches: any[];
      scores: Record<string, { score: number; beach: any }>;
      forecast: any;
      totalCount: number;
    }>(`/api/filtered-beaches${query ? `?${query}` : ""}`);
  },

  // Regions
  getRegions: async () => {
    // Use direct route instead of proxy (route handler takes precedence)
    const response = await fetch("/api/regions", {
      credentials: "include",
    });
    if (!response.ok) {
      // Handle 429 gracefully - return empty array instead of throwing
      if (response.status === 429) {
        console.warn(
          "[api-client] Rate limited when fetching regions, returning empty array"
        );
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    // Ensure we return an array even if the response is malformed
    return Array.isArray(data) ? data : [];
  },

  // User
  getUser: async (userId: string) => {
    return apiRequest<any>(`/api/user/${userId}`);
  },

  getCurrentUser: async () => {
    return apiRequest<any>("/api/user/current");
  },

  // Notifications
  getNotifications: async () => {
    return apiRequest<any[]>("/api/notifications");
  },

  getNotificationCount: async () => {
    return apiRequest<{ count: number }>("/api/notifications/count");
  },

  markNotificationRead: async (id: string) => {
    return apiRequest<any>(`/api/notifications/${id}`, {
      method: "PUT",
    });
  },

  markAllNotificationsRead: async () => {
    return apiRequest<any>("/api/notifications/read", {
      method: "PUT",
    });
  },

  // Subscriptions
  getSubscriptionStatus: async () => {
    return apiRequest<any>("/api/subscription/status");
  },

  // Sponsors
  getSponsors: async () => {
    return apiRequest<any[]>("/api/sponsors");
  },

  // Health check
  health: async () => {
    return apiRequest<{ status: string; timestamp: string }>("/health");
  },

  // Generic request method for custom endpoints
  request: apiRequest,
};

export default api;
