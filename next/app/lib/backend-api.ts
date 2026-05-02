import { cookies } from "next/headers";
import { getServerAuth } from "./server-auth";
import { getBackendUrl } from "./api-config";

const BACKEND_URL = getBackendUrl();

/**
 * Make a request to the backend API
 * Automatically includes authentication if user is logged in
 */
export async function backendFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add auth token if available
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Forward cookies for session management
  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BACKEND_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

/**
 * Get JSON response from backend API
 * Includes timeout handling to prevent Vercel function timeouts
 */
export async function backendGet<T = any>(
  endpoint: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const timeout = options?.timeout || 8000; // Default 8 second timeout (Vercel Hobby plan has 10s limit)

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await backendFetch(endpoint, {
      ...options,
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `Request failed with status ${response.status}`,
      }));
      throw new Error(
        error.error || `Request failed with status ${response.status}`
      );
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * POST JSON to backend API
 */
export async function backendPost<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await backendFetch(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
    }));
    throw new Error(
      error.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * PUT JSON to backend API
 */
export async function backendPut<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await backendFetch(endpoint, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
    }));
    throw new Error(
      error.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * DELETE request to backend API
 */
export async function backendDelete<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await backendFetch(endpoint, {
    ...options,
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
    }));
    throw new Error(
      error.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

/**
 * PATCH JSON to backend API
 */
export async function backendPatch<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await backendFetch(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
    }));
    throw new Error(
      error.error || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}
