const express = require("express");
const authrouter = express.Router();
const { signup, login, logout, sendotp, verifyOtp, getMe, forgotPassword, refreshToken, testEmail } = require("../controllers/authController");
const { uploadProfileImage } = require("../controllers/imageupload");
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { loginLimiter, sendOtpLimiter, verifyOtpLimiter } = require("../middlewares/rateLimiter");

authrouter.get("/test-email", testEmail);
authrouter.post("/signup", signup);
authrouter.post("/login", loginLimiter, login);
authrouter.post("/logout", logout);
authrouter.post("/refresh-token", refreshToken);
authrouter.post("/refreshtoken", refreshToken);
authrouter.post("/forgot-password", sendOtpLimiter, forgotPassword);
authrouter.post("/forgotpassword", sendOtpLimiter, forgotPassword);
authrouter.get("/me", authMiddleware, getMe);

authrouter.post("/sendotp", sendOtpLimiter, sendotp);
authrouter.post("/send-otp", sendOtpLimiter, sendotp);

authrouter.post("/verifyotp", verifyOtpLimiter, verifyOtp);
authrouter.post("/verify-otp", verifyOtpLimiter, verifyOtp);

authrouter.post("/uploadprofileimage", authMiddleware, upload.single("profileImage"), uploadProfileImage);

module.exports = authrouter;
