// Central env config with startup validation
const required = ['JWT_SECRET', 'MONGODB_URL'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[STARTUP ERROR] Missing required env var: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  senderEmail: process.env.SENDER_EMAIL,
};
