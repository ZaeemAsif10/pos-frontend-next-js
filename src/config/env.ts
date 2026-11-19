/**
 * Application environment configuration.
 * Safely access and type-check environment variables with browser-aware fallback.
 */
function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000/api/v1";
    }
    return `${window.location.origin}/api/v1`;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://metricnests.site/api/v1";
  }
  return "http://localhost:8000/api/v1";
}

export const env = {
  get API_URL(): string {
    return getApiUrl();
  },
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
} as const;
