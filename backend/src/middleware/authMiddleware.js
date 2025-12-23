import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "apex_secret_2252524";

// 🟢 Verify JWT Token
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Must have Authorization: Bearer <token>
  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Attach decoded user info to request object
    next();
  } catch (err) {
    console.error("❌ Invalid or expired token:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
