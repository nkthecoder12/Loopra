const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, 
  message: { success: false, message: "Too many requests, please try again later.", data: null }
});

const sendOtpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, 
  message: { success: false, message: "Too many OTP requests, please try again later.", data: null }
});

const verifyOtpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, 
  message: { success: false, message: "Too many verification attempts, please try again later.", data: null }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, 
  message: { success: false, message: "Too many login attempts, please try again later.", data: null }
});

module.exports = { apiLimiter, sendOtpLimiter, verifyOtpLimiter, loginLimiter };
