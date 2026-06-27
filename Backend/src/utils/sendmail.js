const nodemailer = require("nodemailer");

// Singleton connection-pooled transporter for production cloud environments
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 10000, // 10s connection timeout
  socketTimeout: 15000, // 15s socket timeout
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

// Verify SMTP connection on server startup
if (process.env.NODE_ENV === "production" || process.env.VERIFY_SMTP === "true") {
  transporter.verify((error, success) => {
    if (error) {
      console.error("[SMTP Startup Error] Verification failed:", error.message);
    } else {
      console.log("[SMTP Startup Ready] Email transport ready for dispatch.");
    }
  });
}

/**
 * Enterprise Send Email Dispatcher
 * @param {string} to Recipient email address
 * @param {string} subject Email subject line
 * @param {string} text Plaintext body
 * @param {string} [html] Optional HTML body content
 */
const sendEmail = async (to, subject, text, html = "") => {
  if (!to || !subject) {
    throw new Error("[SendMail] Recipient email and subject are required.");
  }

  const normalizedTo = to.toLowerCase().trim();
  const mailOptions = {
    from: `"${process.env.SENDER_NAME || 'Loopra Mobility'}" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
    to: normalizedTo,
    subject: subject,
    text: text,
    html: html || undefined,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SendMail Success] MessageID: ${info.messageId} | Recipient: ${normalizedTo} | Accepted: ${info.accepted?.join(", ") || normalizedTo}`);
    if (info.rejected && info.rejected.length > 0) {
      console.warn(`[SendMail Warning] Rejected recipients: ${info.rejected.join(", ")}`);
    }
    return info;
  } catch (error) {
    console.error(`[SendMail Failure] Dispatch to ${normalizedTo} failed:`, error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;
