import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};
