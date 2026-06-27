const { Resend } = require("resend");

// Initialize Resend SDK instance safely
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey && process.env.NODE_ENV === "production") {
  console.warn("[Resend Warning] RESEND_API_KEY environment variable is not defined!");
}

const resend = new Resend(resendApiKey || "re_dummy_key_for_dev");

/**
 * Enterprise Send Email Dispatcher powered by Resend API
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
  const fromAddress = process.env.EMAIL_FROM || "Loopra <noreply@loopra.co.in>";

  console.log(`[Resend Dispatch] Sending email to: ${normalizedTo} | Subject: "${subject}"`);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: [normalizedTo],
      subject: subject,
      text: text,
      html: html || undefined,
    });

    if (response.error) {
      console.error(`[Resend API Error] Failed delivering to ${normalizedTo}:`, response.error.message);
      throw new Error(`Resend API Error: ${response.error.message}`);
    }

    console.log(`[Resend Dispatch Success] Email ID: ${response.data?.id} | Recipient: ${normalizedTo}`);
    return response.data;
  } catch (error) {
    console.error(`[Resend Runtime Exception] Failed delivering to ${normalizedTo}:`, error.message);
    if (error.stack) {
      console.error(`[Resend Stack Trace]:`, error.stack);
    }
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;
