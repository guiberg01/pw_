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

export const isAdmin = (req, res, next) => {
  console.log("Verificando se o usuário é admin:", req.user);
  try {
    const userRole = req.user.role;
    if (userRole !== "admin") {
      throw new Error("NotAdmin");
    }
    next();
  } catch (error) {
    next(error);
  }
};
