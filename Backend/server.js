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
const { corsOptions, socketCorsOptions, getAllowedOrigins } = require("./src/config/cors");
const { razorpayWebhook } = require("./src/controllers/paymentController");

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

const io = new Server(server, {
  cors: socketCorsOptions,
  transports: ["websocket", "polling"],
});

app.set("io", io);

connectDB();

app.use(cors(corsOptions));

// Razorpay webhook MUST receive raw body — register before express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLimiter);

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/rides", require("./src/routes/rideRoutes"));
app.use("/api/advance-rides", require("./src/routes/advanceRideRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/payments", require("./src/routes/paymentRoutes"));
app.use("/api/ratings", require("./src/routes/ratingRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/tracking", require("./src/routes/trackingRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/driver", require("./src/routes/driverRoutes"));

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    allowedOrigins: getAllowedOrigins(),
  })
);

require("./src/sockets/rideSocket")(io);
startAdvanceRidePoller(io);

app.use(errorHandler);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`[Server] Started on PORT: ${port}`);
  console.log(`[Server] Allowed origins: ${getAllowedOrigins().join(", ")}`);
});
