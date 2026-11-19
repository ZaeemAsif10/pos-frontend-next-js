import { env } from "@/config/env";
import type { ApiErrorResponse } from "@/types/api";

export class ApiError extends Error {
  status: number;
  data?: ApiErrorResponse;

  constructor(status: number, message: string, data?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Type-safe HTTP client wrapper around native fetch for the Paperless FastAPI backend.
 * Automatically attaches Authorization header if access token exists.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;
  const baseUrl = env.API_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let url = `${baseUrl}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Attach Bearer token from localStorage in browser context
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("paperless_access_token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  });

  if (!response.ok) {
    let errorData: any;
    let rawText = "";
    try {
      rawText = await response.text();
      errorData = rawText ? JSON.parse(rawText) : undefined;
    } catch {
      // Non-JSON error payload
    }

    let message = "";
    if (typeof errorData?.detail === "string" && errorData.detail.trim()) {
      message = errorData.detail;
    } else if (Array.isArray(errorData?.detail) && errorData.detail.length > 0) {
      message = errorData.detail
        .map((item: any) => {
          const loc = Array.isArray(item?.loc)
            ? item.loc.filter((p: any) => p !== "body" && p !== "query" && p !== "path").join(".")
            : "";
          const field = loc ? `${loc.replace(/_/g, " ")}: ` : "";
          return `${field}${item?.msg || "Invalid value"}`;
        })
        .join(" | ");
    } else if (typeof errorData?.message === "string" && errorData.message.trim()) {
      message = errorData.message;
    } else if (response.status === 401) {
      message = "Your session has expired or you are not logged in. Please sign in again.";
    } else if (response.status === 403) {
      message = "Access denied: You do not have permission or plan quota for this action.";
    } else if (response.status === 404) {
      message = "The requested record or endpoint was not found.";
    } else if (response.status === 409) {
      message = "Conflict: A record with this name or code already exists.";
    } else if (response.status === 422) {
      message = "Validation error: Please check all required fields and try again.";
    } else if (response.status >= 500) {
      message =
        rawText && rawText.length < 200 && !rawText.startsWith("<")
          ? `Server error: ${rawText}`
          : "An unexpected server error occurred while processing your request. Please try again.";
    } else {
      message = `Request failed (${response.status})`;
    }

    throw new ApiError(response.status, message, errorData);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
