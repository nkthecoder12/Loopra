const isProd = process.env.NODE_ENV === "production";

function getRequiredEnvVar(name: string, devDefault: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    if (isProd) {
      throw new Error(`[Configuration Error]: Missing required environment variable ${name} in production.`);
    }
    return devDefault;
  }
  return value.trim().replace(/\/$/, "");
}

/** REST API base URL — must end without trailing slash before /api paths */
export const API_BASE_URL = getRequiredEnvVar("NEXT_PUBLIC_API_URL", "http://localhost:5000/api");

/** Socket.io server URL — no /api suffix */
export const SOCKET_URL = getRequiredEnvVar("NEXT_PUBLIC_SOCKET_URL", "http://localhost:5000");

export const MAPBOX_TOKEN = getRequiredEnvVar("NEXT_PUBLIC_MAPBOX_TOKEN", "");

export const RAZORPAY_KEY_ID = getRequiredEnvVar("NEXT_PUBLIC_RAZORPAY_KEY_ID", "");

if (typeof window !== "undefined" && isProd) {
  if (!API_BASE_URL.startsWith("https://")) {
    console.error("[config] NEXT_PUBLIC_API_URL must use HTTPS in production");
  }
  if (!SOCKET_URL.startsWith("https://")) {
    console.error("[config] NEXT_PUBLIC_SOCKET_URL must use HTTPS in production");
  }
}
