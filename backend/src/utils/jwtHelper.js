import jwt from "jsonwebtoken";

const SECRET_KEY = "apex_secret_2252524"; // better to keep in .env
const EXPIRY = "1h"; // token valid for 1 hour

// 🟢 Generate JWT token
export const generateToken = (user) => {
  const payload = {
    username: user.username,
    role: user.role,
    location_ids: user.location_ids
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRY });
};

// 🟡 Verify JWT token (optional helper)
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return null;
  }
};
