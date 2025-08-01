const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");

const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Get token from header (e.g., "Bearer YOUR_TOKEN_STRING")
      token = req.headers.authorization.split(" ")[1];

      // 3. Verify token using your JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find user by ID from decoded token and attach to request (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      // 5. If successful, proceed to the next middleware/route handler
      next();
    } catch (error) {
      // Log the detailed error for debugging purposes
      console.error("Not authorized, token failed:", error);
      // Send a specific 401 response and immediately return
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    }
  }

  // If no token was found in the header at all
  if (!token) {
    // Send a specific 401 response and immediately return
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
};

module.exports = { protect }; // <<<--- Export as an object for consistency and future expansion
