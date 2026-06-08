const express = require("express");
const authrouter = express.Router();
const { signup, login, logout, sendotp, verifyOtp, getMe } = require("../controllers/authController");
const { uploadProfileImage } = require("../controllers/imageupload");
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const { loginLimiter, sendOtpLimiter, verifyOtpLimiter } = require("../middlewares/rateLimiter");

authrouter.post("/signup", signup);
authrouter.post("/login", loginLimiter, login);
authrouter.post("/logout", logout);
authrouter.get("/me", authMiddleware, getMe);                                    // Issue #5: session hydration

// Issue #6: /sendotp + alias /send-otp  (frontend calls /send-otp)
authrouter.post("/sendotp", sendOtpLimiter, sendotp);
authrouter.post("/send-otp", sendOtpLimiter, sendotp);

// Issue #7: /verifyotp + alias /verify-otp  (frontend calls /verify-otp)
authrouter.post("/verifyotp", verifyOtpLimiter, verifyOtp);
authrouter.post("/verify-otp", verifyOtpLimiter, verifyOtp);

authrouter.post("/uploadprofileimage", upload.single("profileImage"), uploadProfileImage);

module.exports = authrouter;
