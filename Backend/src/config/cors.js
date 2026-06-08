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

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return true;

  // Vercel preview deployments: https://<project>-<hash>.vercel.app
  if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return true;

  return false;
}

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
};

const socketCorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Socket CORS blocked for origin: ${origin}`));
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
