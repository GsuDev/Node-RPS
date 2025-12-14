import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username y password son requeridos" });
    }

    if (username.length < 3 || username.length > 50) {
      return res
        .status(400)
        .json({ error: "Username debe tener entre 3 y 50 caracteres" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password debe tener al menos 6 caracteres" });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "El username ya existe" });
    }

    const user = await User.create({ username, password });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: user.id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        gamesPlayed: user.gamesPlayed,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username y password son requeridos" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        gamesPlayed: user.gamesPlayed,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};
