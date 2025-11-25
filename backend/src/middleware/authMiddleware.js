import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// UPDATED: Now checks for POSITIONS, not Roles.
export const authorizeRoles = (...allowedPositions) => {
  return (req, res, next) => {
    if (!req.user) {
       return res.status(403).json({ message: "Access forbidden: not authenticated" });
    }

    // 1. Get the user's position from the token
    // (Note: We trimmed the position in the authController, so "F&B Admin " became "F&B Admin")
    const userPosition = req.user.position; 

    // 2. Check if the user's position is in the allowed list
    // We treat specific positions as valid.
    // NOTE: We also check if the user is a 'customer' (who has no position) 
    // to prevent crashes if a customer tries to access staff routes.
    if (!userPosition || !allowedPositions.includes(userPosition)) {
      console.log(`Access Denied: User position '${userPosition}' is not in allowed list:`, allowedPositions);
      return res.status(403).json({ message: "Access forbidden: insufficient privileges" });
    }

    next();
  };
};