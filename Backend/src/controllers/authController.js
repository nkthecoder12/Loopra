const usermodel = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendmail");
const { jwtSecret } = require("../config/env");
const otpService = require("../services/otpService");

// ─── helpers ────────────────────────────────────────────────────────────────

const signToken = (user) => {
  const role = (user.role || "USER").toUpperCase();
  return jwt.sign({ id: user._id, role }, jwtSecret, { expiresIn: "7d" });
};

const isProduction = process.env.NODE_ENV === "production";

const setCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    // Cross-origin frontend (Vercel) + API (Render) requires SameSite=None when using cookies
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ─── SIGNUP ─────────────────────────────────────────────────────────────────

const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const existingUser = await usermodel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await usermodel.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword });

    // Auto-send OTP after signup
    try {
      const otp = await otpService.generateOTP(normalizedEmail);
      await sendEmail(normalizedEmail, "Verify your Loopra account", `Your OTP is: ${otp}`);
    } catch (otpErr) {
      console.error("Auto OTP request failed during signup:", otpErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Account created. OTP sent to your email.",
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error creating account", error: error.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await usermodel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account is blocked" });
    }

    const token = signToken(user);
    setCookie(res, token);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage, isVerified: user.isVerified }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error logging in", error: error.message });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error logging out" });
  }
};

// ─── SEND OTP ────────────────────────────────────────────────────────────────

const sendotp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await usermodel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const otp = await otpService.generateOTP(normalizedEmail);
    await sendEmail(normalizedEmail, "Your Loopra OTP", `Your OTP is: ${otp}. Valid for 5 minutes.`);
    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── VERIFY OTP ──────────────────────────────────────────────────────────────

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required" });
  }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await usermodel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Call the enterprise OTP service for verification
    await otpService.verifyOTP(normalizedEmail, otp);

    user.isVerified = true;
    await user.save();

    const token = signToken(user);
    setCookie(res, token);
    return res.status(200).json({
      success: true,
      message: "Verification successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─── GET ME ──────────────────────────────────────────────────────────────────
// Issue #5 — add /auth/me endpoint for session hydration

const getMe = async (req, res) => {
  try {
    const user = await usermodel.findById(req.user.id).select("name email role profileImage isVerified");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await usermodel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({ success: true, message: "If an account exists, a verification code was sent." });
    }
    const otp = await otpService.generateOTP(normalizedEmail);
    await sendEmail(normalizedEmail, "Reset your Loopra password", `Your password reset OTP code is: ${otp}. Valid for 5 minutes.`);
    return res.status(200).json({ success: true, message: "Password reset OTP sent to your email." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const decoded = jwt.verify(token, jwtSecret);
    const user = await usermodel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }
    const newToken = signToken(user);
    setCookie(res, newToken);
    return res.status(200).json({ success: true, token: newToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// ─── TEST EMAIL ENDPOINT ─────────────────────────────────────────────────────

const testEmail = async (req, res) => {
  const targetEmail = req.query.email || "test@loopra.co.in";
  try {
    const data = await sendEmail(targetEmail, "Loopra Resend Diagnostic Test", "If you receive this, Resend HTTPS delivery is 100% operational!");
    return res.status(200).json({ success: true, message: "Diagnostic email dispatched via Resend API", data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause
    });
  }
};

module.exports = { signup, login, logout, sendotp, verifyOtp, getMe, forgotPassword, refreshToken, testEmail };