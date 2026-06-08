const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async ({ amount, currency, receipt }) => {
  return razorpay.orders.create({
    amount,        // in paise
    currency,
    receipt
  });
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};

const fetchPayment = async (paymentId) => {
  return razorpay.payments.fetch(paymentId);
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
