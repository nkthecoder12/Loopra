const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const OTP = require("../models/OTP");

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_THROTTLE_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

/**
 * Generate a new secure 6-digit OTP and store its hash in the database.
 * Enforces resend throttle protection.
 * @param {string} email 
 * @returns {Promise<string>} The plaintext OTP to be sent via email/SMS.
 */
const generateOTP = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  // Check resend throttle
  const existingOtp = await OTP.findOne({ email: normalizedEmail });
  if (existingOtp) {
    const timeSinceLastSent = now.getTime() - existingOtp.lastSentAt.getTime();
    if (timeSinceLastSent < RESEND_THROTTLE_MS) {
      throw new Error(`Please wait ${Math.ceil((RESEND_THROTTLE_MS - timeSinceLastSent) / 1000)} seconds before requesting a new OTP.`);
    }
  }

  // Generate 6-digit OTP
  // Standard crypto-secure random numeric generator
  const otpVal = crypto.randomInt(100000, 999999).toString();

  // Securely hash the OTP
  const hashedOtp = await bcrypt.hash(otpVal, 10);

  // Upsert OTP record
  await OTP.findOneAndUpdate(
    { email: normalizedEmail },
    {
      codeHash: hashedOtp,
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
      attempts: 0,
      lastSentAt: now
    },
    { upsert: true, new: true }
  );

  return otpVal;
};

/**
 * Verify a plaintext OTP against the securely stored hash.
 * Enforces single-use consumption and brute-force block.
 * @param {string} email 
 * @param {string} code 
 * @returns {Promise<boolean>} True if valid and successfully consumed.
 */
const verifyOTP = async (email, code) => {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  const otpRecord = await OTP.findOne({ email: normalizedEmail });
  if (!otpRecord) {
    throw new Error("OTP not requested or has expired.");
  }

  // Check expiration
  if (now.getTime() > otpRecord.expiresAt.getTime()) {
    await OTP.deleteOne({ email: normalizedEmail });
    throw new Error("OTP has expired. Please request a new one.");
  }

  // Brute-force protection check
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    await OTP.deleteOne({ email: normalizedEmail });
    throw new Error("Too many invalid verification attempts. OTP has been locked. Please request a new one.");
  }

  // Secure comparison using constant-time comparison helper via bcrypt
  const isMatch = await bcrypt.compare(code, otpRecord.codeHash);
  if (!isMatch) {
    // Increment wrong attempts counter
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new Error(`Invalid OTP. You have ${MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`);
  }

  // Delete on success (single-use constraint)
  await OTP.deleteOne({ email: normalizedEmail });
  return true;
};

module.exports = {
  generateOTP,
  verifyOTP
};
