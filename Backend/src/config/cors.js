const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

const DEFAULT_PRODUCTION_FRONTEND = "https://loopra-gamma.vercel.app";

/**
 * Build allowed CORS / Socket.io origins from environment.
 * FRONTEND_URL — primary production frontend
 * CORS_ALLOWED_ORIGINS — comma-separated extra origins
 */
function getAllowedOrigins() {
  const origins = new Set(LOCAL_ORIGINS);

  const frontendUrl = (process.env.FRONTEND_URL || DEFAULT_PRODUCTION_FRONTEND).trim().replace(/\/$/, "");
  origins.add(frontendUrl);

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

  if (lowerOrigin === "https://loopra-gamma.vercel.app") return true;

  // Vercel preview/production deployments
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(lowerOrigin)) return true;

  const allowed = getAllowedOrigins().map(o => o.toLowerCase().trim().replace(/\/$/, ""));
  if (allowed.includes(lowerOrigin)) return true;

  return false;
}

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      return callback(null, false);
    }
    if (isOriginAllowed(origin)) {
      callback(null, origin);
    } else {
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  optionsSuccessStatus: 200,
};

const socketCorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, false);
    }
    if (isOriginAllowed(origin)) {
      callback(null, origin);
    } else {
      callback(new Error(`Socket CORS blocked: ${origin} not allowed`));
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
