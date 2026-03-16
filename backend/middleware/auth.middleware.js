import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isLoggedIn = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new Error("NoToken");
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new Error("UserNotFound");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new Error("UserNotFound");
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new Error("Forbidden");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const isAdmin = authorizeRoles("admin");
export const isSellerOrAdmin = authorizeRoles("seller", "admin");
