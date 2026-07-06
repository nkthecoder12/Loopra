let ioInstance = null;

const socketService = {
  init: (io) => {
    ioInstance = io;
  },

  getIO: () => {
    return ioInstance;
  },

  /**
   * Emit event to user room (user_${userId}) with acknowledgment retries
   * @param {string} userId - Target User ID
   * @param {string} event - Event name
   * @param {object} data - Payload
   * @param {number} retries - Retry limit (defaults to 3)
   * @returns {Promise<{ success: boolean, reason?: string }>}
   */
  emitToUserWithRetry: (userId, event, data, retries = 3) => {
    return new Promise((resolve) => {
      if (!ioInstance) {
        return resolve({ success: false, reason: "Socket server not initialized" });
      }

      const room = `user_${userId}`;
      const rooms = ioInstance.sockets.adapter.rooms;
      const activeRoom = rooms.get(room);

      // If no clients are connected to this user room, mark as offline immediately
      if (!activeRoom || activeRoom.size === 0) {
        return resolve({ success: false, reason: "Offline" });
      }

      let attempt = 0;

      const tryEmit = () => {
        attempt++;
        // Emit event to room with a 2-second timeout for client ack callback
        ioInstance.to(room).timeout(2000).emit(event, data, (err, responses) => {
          if (err) {
            // Acknowledgment timeout error
            if (attempt < retries) {
              setTimeout(tryEmit, 1000); // Wait 1 second before retrying
            } else {
              resolve({ success: false, reason: "Timeout after maximum retries" });
            }
          } else {
            // Success: Client responded with acknowledgment
            resolve({ success: true });
          }
        });
      };

      tryEmit();
    });
  },
};

module.exports = socketService;
