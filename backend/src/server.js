import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js";
import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/game.js";
import { setupGameSocket } from "./socket/gameSocket.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api", gameRoutes);

// Ruta de prueba
app.get("/api/holaholitafernando", (req, res) => {
  res.json({ status: "OK", message: "Soy un servidor contento y funcionando" });
});

// Configurar Socket.IO
setupGameSocket(io);

// Sincronizar base de datos e iniciar servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    // Esto es para hacer efectivos los cambios en los modelos
    await sequelize.sync({ alter: true });
    console.log("✅ Modelos sincronizados");

    // Levanta los dos servidores
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
