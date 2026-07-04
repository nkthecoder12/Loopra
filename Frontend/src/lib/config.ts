export const PRODUCTION_API_URL = "https://loopra.onrender.com/api";
export const PRODUCTION_SOCKET_URL = "https://loopra.onrender.com";
export const PRODUCTION_FRONTEND_URL = "https://www.loopra.co.in";

function resolveUrl(
  envValue: string | undefined,
  productionDefault: string,
  localDefault: string
): string {
  const value = (envValue || "").trim();
  if (value) return value.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    return productionDefault;
  }

  return localDefault;
}

/** REST API base URL — must end without trailing slash before /api paths */
export const API_BASE_URL = resolveUrl(
  process.env.NEXT_PUBLIC_API_URL,
  PRODUCTION_API_URL,
  "http://localhost:5000/api"
);

/** Socket.io server URL — no /api suffix */
export const SOCKET_URL = resolveUrl(
  process.env.NEXT_PUBLIC_SOCKET_URL,
  PRODUCTION_SOCKET_URL,
  "http://localhost:5000"
);

export const MAPBOX_TOKEN = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();

export const RAZORPAY_KEY_ID = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();

if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  if (!API_BASE_URL.startsWith("https://")) {
    console.error("[config] NEXT_PUBLIC_API_URL must use HTTPS in production");
  }
  if (!SOCKET_URL.startsWith("https://")) {
    console.error("[config] NEXT_PUBLIC_SOCKET_URL must use HTTPS in production");
  }
}
