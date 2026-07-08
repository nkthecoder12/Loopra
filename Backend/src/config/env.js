const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const isProd = nodeEnv === 'production';

// Central env config with startup validation
const required = ['JWT_SECRET', 'MONGODB_URL'];
if (isProd) {
  required.push('FRONTEND_URL');
}

for (const key of required) {
  const val = process.env[key];
  if (!val || !val.trim()) {
    console.error(`[STARTUP ERROR] Missing required env var: ${key}`);
    process.exit(1);
  }
}

const getEnv = (key, fallback = '') => {
  const val = process.env[key];
  if (val === undefined || val === null) return fallback;
  return val.trim();
};

module.exports = {
  port: parseInt(getEnv('PORT')) || 5000,
  mongoUri: getEnv('MONGODB_URL'),
  jwtSecret: getEnv('JWT_SECRET'),
  nodeEnv,
  frontendUrl: getEnv('FRONTEND_URL').replace(/\/$/, ""),
  corsAllowedOrigins: getEnv('CORS_ALLOWED_ORIGINS'),
  razorpayKeyId: getEnv('RAZORPAY_KEY_ID'),
  razorpayKeySecret: getEnv('RAZORPAY_KEY_SECRET'),
  razorpayWebhookSecret: getEnv('RAZORPAY_WEBHOOK_SECRET'),
  resendApiKey: getEnv('RESEND_API_KEY'),
  emailFrom: getEnv('EMAIL_FROM', 'Loopra <noreply@loopra.co.in>'),
};
