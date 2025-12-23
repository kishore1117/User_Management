// 🟣 Allow only specific roles (e.g., Admin)
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({ message: "User role not found" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }

    next(); // ✅ Role is authorized
  };
};
