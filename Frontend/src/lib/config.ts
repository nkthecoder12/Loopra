const isProd = process.env.NODE_ENV === "production";

// Read variables as literal properties so Next.js static compiler replaces them
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const rawSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
const rawMapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const rawRazorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

function validateAndResolve(value: string | undefined, name: string, devDefault: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    if (isProd) {
      throw new Error(`[Configuration Error]: Missing required environment variable ${name} in production.`);
    }
    return devDefault;
  }
  return trimmed.replace(/\/$/, "");
}

/** REST API base URL — must end without trailing slash before /api paths */
export const API_BASE_URL = validateAndResolve(rawApiUrl, "NEXT_PUBLIC_API_URL", "http://localhost:5000/api");

/** Socket.io server URL — no /api suffix */
export const SOCKET_URL = validateAndResolve(rawSocketUrl, "NEXT_PUBLIC_SOCKET_URL", "http://localhost:5000");

export const MAPBOX_TOKEN = validateAndResolve(rawMapboxToken, "NEXT_PUBLIC_MAPBOX_TOKEN", "");

export const RAZORPAY_KEY_ID = validateAndResolve(rawRazorpayKeyId, "NEXT_PUBLIC_RAZORPAY_KEY_ID", "");

if (typeof window !== "undefined" && isProd) {
  if (!API_BASE_URL.startsWith("https://")) {
    console.error("[config] NEXT_PUBLIC_API_URL must use HTTPS in production");
  }
  if (!SOCKET_URL.startsWith("https://")) {
    console.error("[config] NEXT_PUBLIC_SOCKET_URL must use HTTPS in production");
  }
}
