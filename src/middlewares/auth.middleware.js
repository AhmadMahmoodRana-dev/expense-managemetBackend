import jwt from "jsonwebtoken";
import User from "../schema/User.schema.js";

/**
 * Protect routes - verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Not authorized" });
  }
};

/**
 * Check if user is verified
 */
export const requireVerified = async (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ 
      message: "Please verify your email to access this resource",
      requiresVerification: true 
    });
  }
  next();
};

/**
 * Check if user is admin (optional - for future use)
 */
export const requireAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};