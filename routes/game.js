import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  createGame,
  getAvailableGames,
  joinGame,
  getMyGame,
  getRanking,
} from "../controllers/gameController.js";

const router = express.Router();

router.post("/games", authenticateToken, createGame);
router.get("/games/available", authenticateToken, getAvailableGames);
router.get("/games/my-game", authenticateToken, getMyGame);
router.post("/games/:gameId/join", authenticateToken, joinGame);
router.get("/ranking", authenticateToken, getRanking);

export default router;
