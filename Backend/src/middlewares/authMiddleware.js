const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

const authMiddleware = (req, res, next) => {
  try {
    // 1. Read Authorization header or cookie
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2. Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // 4. Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // 5. Attach user info to request
    req.user = decoded; // { id, role, iat, exp }

    // 6. Allow request to continue
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = authMiddleware;
