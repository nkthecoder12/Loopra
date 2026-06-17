const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const { socketAuth } = require("../utils/socketAuth");
const { RIDE_STATUS } = require("../utils/constants");
const { enforceStatusTransition } = require("../utils/rideStateMachine");

module.exports = function (io) {
  // ── Auth middleware for all socket connections ──
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    console.log(`[Socket] Connected: ${socket.id} | User: ${userId} | Role: ${role}`);

    // Automatically join the user-specific room
    socket.join(`user_${userId}`);
    console.log(`[Socket] User ${userId} auto-joined personal room user_${userId}`);

    // ── Issue #23: Driver room management ────────────────────────────────────
    // When driver goes online join their personal room so ride offers reach them
    socket.on("driver-go-online", async () => {
      if (role !== "DRIVER") return;
      const room = `driver_${userId}`;
      socket.join(room);
      console.log(`[Socket] Driver ${userId} joined room ${room}`);
      socket.emit("driver-online-confirmed", { room });
    });

    // ── JOIN RIDE ROOM ────────────────────────────────────────────────────────
    // Issue #24: On reconnect emit current ride state so client can recover
    socket.on("join-ride", async ({ rideId }) => {
      try {
        if (!rideId || typeof rideId !== "string") {
          return socket.emit("error", { message: "Invalid ride ID" });
        }

        const ride = await Ride.findById(rideId).populate("driverId", "name phone vehicle location");
        if (!ride) return socket.emit("error", { message: "Ride not found" });

        // Authorise: user must own the ride OR driver must be assigned
        if (role === "USER" && ride.userId.toString() !== userId) {
          return socket.emit("error", { message: "Unauthorized access to ride" });
        }
        if (role === "DRIVER") {
          const driver = await Driver.findOne({ userId });
          if (!driver || driver._id.toString() !== ride.driverId?.toString()) {
            return socket.emit("error", { message: "Not assigned to this ride" });
          }
        }

        const roomName = `ride_${rideId}`;
        socket.join(roomName);
        console.log(`[Socket] ${socket.id} joined ${roomName}`);

        // Immediately emit current state so client can recover after reconnect
        socket.emit("ride-state-snapshot", {
          rideId: ride._id,
          status: ride.status,
          stateVersion: ride.stateVersion,
          driver: ride.driverId
            ? {
                name: ride.driverId.name,
                phone: ride.driverId.phone,
                vehicle: ride.driverId.vehicle,
                location: ride.driverId.location,
              }
            : null,
          fare: ride.fare,
          finalFare: ride.finalFare,
          otp: role === "USER" ? ride.otp : null,
        });

        socket.emit("joined-ride", { rideId, roomName });
      } catch (err) {
        console.error("[Socket] join-ride error:", err);
        socket.emit("error", { message: "Failed to join ride" });
      }
    });

    // ── DRIVER LOCATION ───────────────────────────────────────────────────────
    // Issue #22: event was "live-location" on driver; backend expects "driver-location"
    // Also save to DB so location persists across reconnects
    socket.on("driver-location", async ({ rideId, latitude, longitude }) => {
      try {
        if (role !== "DRIVER") {
          return socket.emit("error", { message: "Only drivers can share location" });
        }
        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number" ||
          latitude < -90 || latitude > 90 ||
          longitude < -180 || longitude > 180
        ) {
          return socket.emit("error", { message: "Invalid coordinates" });
        }

        // Persist driver location to DB
        await Driver.findOneAndUpdate(
          { userId },
          { $set: { "location.coordinates": [longitude, latitude] } }
        );

        if (!rideId) return; // location update without ride (driver online, no ride)

        // Save coordinate track history
        const Tracking = require("../models/Tracking");
        await Tracking.create({
          rideId,
          location: {
            type: "Point",
            coordinates: [longitude, latitude]
          }
        }).catch(err => console.error("[Socket] Failed to log path coordinate:", err.message));

        const ride = await Ride.findById(rideId);
        if (!ride || ![RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING].includes(ride.status)) return;

        const driver = await Driver.findOne({ userId });
        if (!driver || driver._id.toString() !== ride.driverId?.toString()) return;

        // Broadcast to ride room as "live-location" (what frontend listens to)
        const roomName = `ride_${rideId}`;
        socket.to(roomName).emit("live-location", {
          rideId,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[Socket] driver-location error:", err);
      }
    });

    // ── RIDE STATUS UPDATE VIA SOCKET ─────────────────────────────────────────
    // Issue #26: Must call enforceStatusTransition before saving
    socket.on("ride-status-update", async ({ rideId, status }) => {
      try {
        if (role !== "DRIVER") {
          return socket.emit("error", { message: "Only drivers can update ride status" });
        }
        if (!Object.values(RIDE_STATUS).includes(status)) {
          return socket.emit("error", { message: "Invalid ride status" });
        }

        const ride = await Ride.findById(rideId);
        if (!ride) return socket.emit("error", { message: "Ride not found" });

        const driver = await Driver.findOne({ userId });
        if (!driver || driver._id.toString() !== ride.driverId?.toString()) {
          return socket.emit("error", { message: "Not assigned to this ride" });
        }

        // ← FIXED: enforce state machine before mutating
        try {
          enforceStatusTransition(ride, status, role);
        } catch (stateErr) {
          return socket.emit("error", { message: stateErr.message });
        }

        ride.status = status;
        await ride.save();

        const roomName = `ride_${rideId}`;
        io.to(roomName).emit("ride-status-updated", {
          rideId,
          status,
          stateVersion: ride.stateVersion,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[Socket] ride-status-update error:", err);
        socket.emit("error", { message: "Failed to update ride status" });
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on("leave-ride", ({ rideId }) => {
      if (rideId) {
        const roomName = `ride_${rideId}`;
        socket.leave(roomName);
        console.log(`[Socket] ${socket.id} left room ${roomName}`);
        socket.emit("left-ride", { rideId });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id} | User: ${userId}`);
    });

    socket.on("error", (error) => {
      console.error("[Socket] Error:", error);
    });
  });
};
