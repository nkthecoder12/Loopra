const { RIDE_STATUS } = require("../utils/constants");

// Valid state transitions for ride lifecycle
const VALID_TRANSITIONS = {
  [RIDE_STATUS.REQUESTED]: [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.CANCELLED, RIDE_STATUS.FAILED],
  [RIDE_STATUS.DRIVER_ASSIGNED]: [RIDE_STATUS.ONGOING, RIDE_STATUS.CANCELLED, RIDE_STATUS.REQUESTED],
  [RIDE_STATUS.ONGOING]: [RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLEDMIDDLE],
  [RIDE_STATUS.COMPLETED]: [], // Terminal state
  [RIDE_STATUS.CANCELLED]: [], // Terminal state
  [RIDE_STATUS.FAILED]: [], // Terminal state
  [RIDE_STATUS.CANCELLEDMIDDLE]: [] // Terminal state
};

/**
 * Validates if a ride status transition is allowed
 * @param {string} currentStatus - Current ride status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} - Whether transition is valid
 */
const isValidTransition = (currentStatus, newStatus) => {
  if (!VALID_TRANSITIONS[currentStatus]) {
    return false;
  }
  
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
};

/**
 * Enforces ride status transition
 * @param {Object} ride - Ride document
 * @param {string} newStatus - New status to set
 * @param {string} requestorRole - Role of person making request (USER/DRIVER)
 * @throws {Error} - If transition is invalid
 */
const enforceStatusTransition = (ride, newStatus, requestorRole = null) => {
  const currentStatus = ride.status;
  
  // Check if transition is valid
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
  
  // Role-based transition validation
  if (requestorRole) {
    validateRoleBasedTransition(currentStatus, newStatus, requestorRole);
  }
};

/**
 * Validates role-based status transitions
 */
const validateRoleBasedTransition = (currentStatus, newStatus, role) => {
  // Users can cancel rides only before driver accepts (i.e. status is REQUESTED)
  if (role === "USER" && newStatus === RIDE_STATUS.CANCELLED) {
    if (currentStatus !== RIDE_STATUS.REQUESTED) {
      throw new Error("Users can only cancel rides before driver accepts");
    }
  }

  // Drivers can cancel rides only before ride starts (i.e. status is DRIVER_ASSIGNED)
  if (role === "DRIVER" && newStatus === RIDE_STATUS.CANCELLED) {
    if (currentStatus !== RIDE_STATUS.DRIVER_ASSIGNED) {
      throw new Error("Drivers can only cancel rides before they start");
    }
  }
  
  // Drivers can start rides in DRIVER_ASSIGNED state
  if (role === "DRIVER" && newStatus === RIDE_STATUS.ONGOING) {
    if (currentStatus !== RIDE_STATUS.DRIVER_ASSIGNED) {
      throw new Error("Drivers can only start assigned rides");
    }
  }
  
  // Drivers can complete rides in ONGOING state
  if (role === "DRIVER" && newStatus === RIDE_STATUS.COMPLETED) {
    if (currentStatus !== RIDE_STATUS.ONGOING) {
      throw new Error("Drivers can only complete ongoing rides");
    }
  }
};

/**
 * Gets next valid statuses for current ride state
 * @param {string} currentStatus - Current ride status
 * @returns {Array} - Array of valid next statuses
 */
const getNextValidStatuses = (currentStatus) => {
  return VALID_TRANSITIONS[currentStatus] || [];
};

/**
 * Checks if ride is in terminal state
 * @param {string} status - Ride status
 * @returns {boolean} - Whether ride is in terminal state
 */
const isTerminalState = (status) => {
  const terminalStates = [RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED, RIDE_STATUS.FAILED, RIDE_STATUS.CANCELLEDMIDDLE];
  return terminalStates.includes(status);
};

module.exports = {
  isValidTransition,
  enforceStatusTransition,
  getNextValidStatuses,
  isTerminalState,
  VALID_TRANSITIONS
};
