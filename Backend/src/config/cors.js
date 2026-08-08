const HARDCODED_ALLOWED_ORIGINS = [
  "https://www.loopra.co.in",
  "https://loopra.co.in",
  "https://loopra-gamma.vercel.app",
  "https://fleet.loopra.co.in",
  "http://localhost:3000",
  "http://localhost:3001",
];

const DEFAULT_PRODUCTION_FRONTEND = "https://www.loopra.co.in";

/**
 * Build allowed CORS / Socket.io origins from environment + hardcoded defaults.
 */
function getAllowedOrigins() {
  const origins = new Set(HARDCODED_ALLOWED_ORIGINS);

  if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, "");
    if (frontendUrl) origins.add(frontendUrl);
  }

  if (process.env.CORS_ALLOWED_ORIGINS) {
    process.env.CORS_ALLOWED_ORIGINS.split(",").forEach((origin) => {
      const trimmed = origin.trim().replace(/\/$/, "");
      if (trimmed) origins.add(trimmed);
    });
  }

  return Array.from(origins);
}

function isOriginAllowed(origin) {
  if (!origin) return true;

  const lowerOrigin = origin.toLowerCase().trim().replace(/\/$/, "");

  // Allow explicit custom domains & localhost
  if (HARDCODED_ALLOWED_ORIGINS.includes(lowerOrigin)) return true;

  // Vercel preview/production deployments matching *.vercel.app
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(lowerOrigin)) return true;

  const allowed = getAllowedOrigins().map(o => o.toLowerCase().trim().replace(/\/$/, ""));
  if (allowed.includes(lowerOrigin)) return true;

  return false;
}

const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked]: ${origin}`);
      callback(null, false);
    }
  },
  optionsSuccessStatus: 200,
};

const socketCorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[Socket CORS Blocked]: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
  corsOptions,
  socketCorsOptions,
  DEFAULT_PRODUCTION_FRONTEND,
};
