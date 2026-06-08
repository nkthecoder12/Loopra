const jwt = require("jsonwebtoken");

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    
    // Attach user info to socket
    socket.user = {
      userId: decoded.id || decoded.userId,
      role: decoded.role || "USER"
    };

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Invalid authentication token"));
  }
};

// Rate limiting for socket events
const createSocketRateLimiter = (maxEvents = 100, windowMs = 60000) => {
  const eventCounts = new Map();

  return (socket, next) => {
    const socketId = socket.id;
    
    socket.use((packet, next) => {
      const now = Date.now();
      const count = eventCounts.get(socketId) || { count: 0, resetTime: now + windowMs };
      
      if (now > count.resetTime) {
        count.count = 0;
        count.resetTime = now + windowMs;
      }
      
      count.count++;
      eventCounts.set(socketId, count);
      
      if (count.count > maxEvents) {
        return next(new Error("Rate limit exceeded"));
      }
      
      next();
    });
    
    // Cleanup on disconnect
    socket.on("disconnect", () => {
      eventCounts.delete(socketId);
    });
    
    next();
  };
};

// Validate socket event data
const validateSocketEvent = (schema) => {
  return (socket, next) => {
    const originalEmit = socket.emit;
    
    socket.emit = (event, data, ...args) => {
      if (schema[event] && !schema[event](data)) {
        console.error(`Invalid data for event ${event}:`, data);
        return socket.emit("error", { message: `Invalid data for ${event}` });
      }
      
      return originalEmit.call(socket, event, data, ...args);
    };
    
    next();
  };
};

// Event schemas for validation
const eventSchemas = {
  "driver-location": (data) => {
    return data && 
           typeof data.rideId === 'string' &&
           typeof data.latitude === 'number' &&
           typeof data.longitude === 'number' &&
           data.latitude >= -90 && data.latitude <= 90 &&
           data.longitude >= -180 && data.longitude <= 180;
  },
  
  "join-ride": (data) => {
    return data && typeof data.rideId === 'string';
  }
};

// Room access control
const checkRoomAccess = (socket, roomName, callback) => {
  // Extract ride ID from room name
  const rideIdMatch = roomName.match(/^ride_(.+)$/);
  if (!rideIdMatch) {
    return callback(false);
  }
  
  const rideId = rideIdMatch[1];
  const user = socket.user;
  
  // This would typically involve a database check
  // For now, we'll implement basic logic
  callback(true);
};

module.exports = {
  socketAuth,
  createSocketRateLimiter,
  validateSocketEvent,
  eventSchemas,
  checkRoomAccess
};
