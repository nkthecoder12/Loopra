/**
 * End-to-end API + Socket audit script
 * Run: node audit-test.js
 */
const http = require("http");
const { io } = require("socket.io-client");

const BASE = "http://localhost:5000";
const API = `${BASE}/api`;
const ts = Date.now();
const PASSENGER = { name: "Audit Passenger", email: `passenger_${ts}@audit.test`, password: "AuditPass123!" };
const DRIVER_USER = { name: "Audit Driver", email: `driver_${ts}@audit.test`, password: "AuditPass123!" };
const ADMIN = { name: "Audit Admin", email: `admin_${ts}@audit.test`, password: "AuditPass123!" };

const results = [];
let passengerToken, driverToken, adminToken, driverId, rideId, otpFromRide;

function log(category, name, status, detail = "") {
  results.push({ category, name, status, detail });
  const icon = status === "PASS" ? "✓" : status === "SKIP" ? "○" : "✗";
  console.log(`${icon} [${category}] ${name} — ${status}${detail ? `: ${detail}` : ""}`);
}

async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data;
  try { data = await res.json(); } catch { data = { raw: await res.text() }; }
  return { status: res.status, data };
}

function socketTest(token, events, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = io(BASE, { auth: { token }, transports: ["websocket"], reconnection: false });
    const received = {};
    const timer = setTimeout(() => {
      socket.disconnect();
      resolve({ connected: socket.connected, received, error: "timeout" });
    }, timeoutMs);

    socket.on("connect", () => { received.connected = true; });
    socket.on("connect_error", (err) => { received.connectError = err.message; });
    for (const [ev, handler] of Object.entries(events)) {
      socket.on(ev, (data) => { received[ev] = data; if (handler) handler(data, socket); });
    }
    socket.on("error", (data) => { received.error = data; });

    socket.on("connect", () => {
      if (events._onConnect) events._onConnect(socket);
    });

    const origResolve = () => { clearTimeout(timer); socket.disconnect(); resolve({ connected: true, received }); };
    if (events._resolveAfter) {
      setTimeout(origResolve, events._resolveAfter);
    }
  });
}

async function run() {
  console.log("\n=== DRIVO E2E AUDIT ===\n");

  // Health
  try {
    const h = await fetch(`${API}/health`);
    const hd = await h.json();
    log("Backend", "Health check", h.status === 200 && hd.status === "ok" ? "PASS" : "FAIL", `status=${h.status}`);
  } catch (e) {
    log("Backend", "Health check", "FAIL", e.message);
    console.log("\nBackend not reachable. Start server first.");
    process.exit(1);
  }

  // AUTH — Signup
  let r = await request("POST", "/auth/signup", PASSENGER);
  log("Auth", "Passenger signup", r.status === 201 ? "PASS" : "FAIL", `${r.status} ${r.data.message || ""}`);

  r = await request("POST", "/auth/signup", DRIVER_USER);
  log("Auth", "Driver user signup", r.status === 201 ? "PASS" : "FAIL", `${r.status}`);

  r = await request("POST", "/auth/signup", ADMIN);
  log("Auth", "Admin signup (as USER)", r.status === 201 ? "PASS" : "FAIL", `${r.status}`);

  // Promote admin in DB
  try {
    const mongoose = require("mongoose");
    require("dotenv").config();
    await mongoose.connect(process.env.MONGODB_URL);
    const User = require("./src/models/User");
    await User.findOneAndUpdate({ email: ADMIN.email }, { role: "ADMIN" });
    await User.findOneAndUpdate({ email: DRIVER_USER.email }, { role: "DRIVER", isVerified: true });
    await User.findOneAndUpdate({ email: PASSENGER.email }, { isVerified: true });
    await mongoose.disconnect();
    log("Auth", "Seed roles (ADMIN/DRIVER/verified)", "PASS", "via direct DB update for audit");
  } catch (e) {
    log("Auth", "Seed roles", "FAIL", e.message);
  }

  // Login
  r = await request("POST", "/auth/login", { email: PASSENGER.email, password: PASSENGER.password });
  passengerToken = r.data.token;
  log("Auth", "Passenger login", r.status === 200 && passengerToken ? "PASS" : "FAIL", `${r.status}`);

  r = await request("POST", "/auth/login", { email: DRIVER_USER.email, password: DRIVER_USER.password });
  driverToken = r.data.token;
  log("Auth", "Driver login", r.status === 200 && driverToken ? "PASS" : "FAIL", `${r.status}`);

  r = await request("POST", "/auth/login", { email: ADMIN.email, password: ADMIN.password });
  adminToken = r.data.token;
  log("Auth", "Admin login", r.status === 200 && adminToken ? "PASS" : "FAIL", `${r.status}`);

  r = await request("GET", "/auth/me", null, passengerToken);
  log("Auth", "GET /auth/me", r.status === 200 ? "PASS" : "FAIL", `${r.status}`);

  // OTP
  r = await request("POST", "/auth/send-otp", { email: PASSENGER.email });
  log("Auth", "Send OTP", r.status === 200 ? "PASS" : "FAIL", `${r.status} ${r.data.message || ""}`);

  // Read OTP from DB for verify test
  try {
    const mongoose = require("mongoose");
    require("dotenv").config();
    await mongoose.connect(process.env.MONGODB_URL);
    const OTP = require("./src/models/OTP");
    const otpDoc = await OTP.findOne({ email: PASSENGER.email }).sort({ createdAt: -1 });
    if (otpDoc) {
      r = await request("POST", "/auth/verify-otp", { email: PASSENGER.email, otp: otpDoc.otp });
      log("Auth", "Verify OTP", r.status === 200 ? "PASS" : "FAIL", `${r.status} ${r.data.message || ""}`);
    } else {
      log("Auth", "Verify OTP", "SKIP", "No OTP in DB (email may have failed)");
    }
    await mongoose.disconnect();
  } catch (e) {
    log("Auth", "Verify OTP", "FAIL", e.message);
  }

  // DRIVER
  r = await request("POST", "/driver/onboard", {
    name: DRIVER_USER.name, phone: `9${String(ts).slice(-9)}`, vehicleType: "Sedan", vehicleNumber: `KA01${ts % 10000}`
  }, driverToken);
  driverId = r.data.driverId;
  log("Driver", "Apply/Onboard", r.status === 201 ? "PASS" : "FAIL", `${r.status} driverId=${driverId || "none"}`);

  r = await request("GET", "/driver/status", null, driverToken);
  log("Driver", "Get status (pending)", r.status === 200 && r.data.onboardingStatus === "PENDING" ? "PASS" : "FAIL", `${r.status} status=${r.data.onboardingStatus}`);

  r = await request("POST", `/admin/drivers/${driverId}/approve`, {}, adminToken);
  log("Driver", "Admin approve", r.status === 200 ? "PASS" : "FAIL", `${r.status}`);

  r = await request("PATCH", "/driver/status", { isOnline: true }, driverToken);
  log("Driver", "Go online", r.status === 200 && r.data.isAvailable === true ? "PASS" : "FAIL", `${r.status}`);

  // Set driver location for matching
  try {
    const mongoose = require("mongoose");
    require("dotenv").config();
    await mongoose.connect(process.env.MONGODB_URL);
    const Driver = require("./src/models/Driver");
    await Driver.findByIdAndUpdate(driverId, {
      location: { type: "Point", coordinates: [77.5946, 12.9716] },
      isAvailable: true,
      onboardingStatus: "APPROVED"
    });
    await mongoose.disconnect();
    log("Driver", "Seed location (Bangalore)", "PASS");
  } catch (e) {
    log("Driver", "Seed location", "FAIL", e.message);
  }

  // RIDE
  const pickup = { lat: 12.9716, lng: 77.5946, address: "MG Road" };
  const drop = { lat: 12.9352, lng: 77.6245, address: "Koramangala" };

  r = await request("POST", "/rides/estimate", { pickup, drop }, passengerToken);
  log("Ride", "Estimate", r.status === 200 && r.data.fare ? "PASS" : "FAIL", `${r.status} fare=${r.data.fare}`);

  r = await request("POST", "/rides/book", { pickup, drop, vehicleType: "economy" }, passengerToken);
  rideId = r.data.rideId;
  otpFromRide = r.data.otp;
  log("Ride", "Book", r.status === 201 && rideId ? "PASS" : "FAIL", `${r.status} rideId=${rideId} otp=${otpFromRide ? "yes" : "no"}`);

  r = await request("GET", "/rides/active", null, passengerToken);
  log("Ride", "Get active ride", r.status === 200 ? "PASS" : "FAIL", `${r.status}`);

  r = await request("POST", `/rides/${rideId}/accept`, {}, driverToken);
  log("Ride", "Driver accept", r.status === 200 ? "PASS" : "FAIL", `${r.status} ${r.data.message || ""}`);

  r = await request("POST", `/rides/${rideId}/start`, { otp: otpFromRide }, driverToken);
  log("Ride", "Start (OTP verify)", r.status === 200 ? "PASS" : "FAIL", `${r.status} ${r.data.message || ""}`);

  r = await request("POST", `/rides/${rideId}/complete`, {}, driverToken);
  log("Ride", "Complete", r.status === 200 ? "PASS" : "FAIL", `${r.status}`);

  // PAYMENTS
  r = await request("POST", `/payments/${rideId}/order`, {}, passengerToken);
  const paymentWorks = r.status === 200 && r.data.orderId;
  log("Payment", "Create order", paymentWorks ? "PASS" : "FAIL", `${r.status} ${r.data.message || r.data.error || ""}`);

  log("Payment", "Verify payment", "SKIP", "Requires real Razorpay test payment");

  // RATING
  r = await request("POST", "/ratings", { rideId, rating: 5, comment: "Great ride", ratedBy: "USER" }, passengerToken);
  log("Rating", "Submit rating", r.status === 201 || r.status === 200 ? "PASS" : "FAIL", `${r.status} ${r.data.message || ""}`);

  // TRACKING
  r = await request("GET", `/tracking/${rideId}/history`, null, passengerToken);
  log("Tracking", "History retrieval", r.status === 200 ? "PASS" : "FAIL", `${r.status}`);

  // ADVANCE RIDE — book second ride
  let rideB;
  r = await request("POST", "/rides/book", { pickup: drop, drop: pickup, vehicleType: "economy" }, passengerToken);
  if (r.status === 201) {
    rideB = r.data.rideId;
    r = await request("POST", "/advance-rides/book", { parentRideId: rideId, pickup: drop, drop: pickup }, passengerToken);
    log("Advance", "Book advance ride", r.status === 201 || r.status === 200 ? "PASS" : "FAIL", `${r.status}`);
  } else {
    log("Advance", "Book advance ride", "SKIP", "Could not create parent ride B");
  }

  // Driver reject test on fresh ride
  r = await request("POST", "/rides/book", { pickup, drop: { lat: 12.95, lng: 77.60, address: "Test" }, vehicleType: "economy" }, passengerToken);
  if (r.status === 201) {
    const rejectRideId = r.data.rideId;
    const rej = await request("POST", `/rides/${rejectRideId}/reject`, {}, driverToken);
    log("Ride", "Driver reject", rej.status === 200 ? "PASS" : "FAIL", `${rej.status}`);
  }

  // SOCKET TESTS
  console.log("\n--- Socket Tests ---\n");

  const sockNoToken = await socketTest(null, {}, 2000);
  log("Socket", "Reject without token", sockNoToken.received.connectError ? "PASS" : "FAIL", sockNoToken.received.connectError || "connected without auth");

  const sockDriver = await socketTest(driverToken, {
    _onConnect: (s) => { s.emit("driver-go-online"); },
    "driver-online-confirmed": () => {},
    _resolveAfter: 2000,
  });
  log("Socket", "Driver go online", sockDriver.received["driver-online-confirmed"] ? "PASS" : "FAIL");

  if (rideId) {
    const sockJoin = await socketTest(passengerToken, {
      _onConnect: (s) => { s.emit("join-ride", { rideId: String(rideId) }); },
      "ride-state-snapshot": () => {},
      "joined-ride": () => {},
      _resolveAfter: 3000,
    });
    log("Socket", "Join ride room", sockJoin.received["joined-ride"] ? "PASS" : "FAIL");
    log("Socket", "Ride state snapshot", sockJoin.received["ride-state-snapshot"] ? "PASS" : "FAIL", sockJoin.received["ride-state-snapshot"]?.status || "");
  }

  // Summary
  const passed = results.filter((x) => x.status === "PASS").length;
  const failed = results.filter((x) => x.status === "FAIL").length;
  const skipped = results.filter((x) => x.status === "SKIP").length;
  console.log(`\n=== SUMMARY: ${passed} PASS / ${failed} FAIL / ${skipped} SKIP ===\n`);

  require("fs").writeFileSync("audit-results.json", JSON.stringify(results, null, 2));
}

run().catch((e) => { console.error("Audit crashed:", e); process.exit(1); });
