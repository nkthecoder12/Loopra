const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./src/config/db");
const errorHandler = require("./src/middlewares/errorHandler");
const { apiLimiter } = require("./src/middlewares/rateLimiter");
const startAdvanceRidePoller = require("./src/jobs/advanceRidePoller");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

// Attach IO to app for controllers to access
app.set("io", io);

connectDB();

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:3001"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/rides", require("./src/routes/rideRoutes"));
app.use("/api/advance-rides", require("./src/routes/advanceRideRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/payments", require("./src/routes/paymentRoutes"));
app.use("/api/ratings", require("./src/routes/ratingRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/tracking", require("./src/routes/trackingRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/driver", require("./src/routes/driverRoutes")); // Issue #17: register driver routes

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── Sockets ───────────────────────────────────────────────────────────────────
require("./src/sockets/rideSocket")(io);

// ── Background Jobs ───────────────────────────────────────────────────────────
startAdvanceRidePoller(io);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`[Server] Started on PORT: ${port}`));
