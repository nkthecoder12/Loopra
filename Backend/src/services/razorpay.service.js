const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async ({ amount, currency, receipt }) => {
  try {
    return await razorpay.orders.create({
      amount,        // in paise
      currency,
      receipt
    });
  } catch (err) {
    console.error("[Razorpay API error]:", err.message);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Razorpay Mock]: Returning mock order in development mode.");
      return {
        id: `order_mock_${Date.now()}`,
        amount,
        currency: currency || "INR",
        receipt,
        status: "created"
      };
    }
    throw err;
  }
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (process.env.NODE_ENV !== "production" && orderId && orderId.startsWith("order_mock_")) {
    console.warn("[Razorpay Mock]: Bypassing signature verification for mock order.");
    return true;
  }
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};

const fetchPayment = async (paymentId) => {
  try {
    return await razorpay.payments.fetch(paymentId);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Razorpay Mock]: Returning mock payment details in development mode.");
      return {
        id: paymentId,
        status: "captured",
        amount: 5000
      };
    }
    throw err;
  }
};

const refundPayment = async (paymentId, amount, receipt) => {
  return razorpay.payments.refund(paymentId, {
    amount,
    notes: { receipt }
  });
};

const verifyWebhookSignature = (rawBody, signature) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchPayment,
  refundPayment,
  verifyWebhookSignature
};
