const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { getUsers, getDrivers, approveDriver, rejectDriver, deactivateDriver } = require("../controllers/admin");

// All admin routes require AUTH + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/users", getUsers);                                   // Issue #15: GET /admin/users
router.get("/drivers", getDrivers);                               // Issue #15: GET /admin/drivers (with populate)
router.post("/drivers/:id/approve", approveDriver);               // Issue #15: approve driver
router.post("/drivers/:id/reject", rejectDriver);                 // Issue #15: reject driver
router.post("/deactivate-driver/:driverId", deactivateDriver);    // existing

module.exports = router;
