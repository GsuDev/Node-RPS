import { User, Game, Round } from "../models/index.js";
import { Op } from "sequelize";

export const createGame = async (req, res) => {
  try {
    const { isMachineGame } = req.body;
    const userId = req.user.id;

    // Verificar si el usuario ya tiene una partida activa
    const activeGame = await Game.findOne({
      where: {
        [Op.or]: [{ player1Id: userId }, { player2Id: userId }],
        status: {
          [Op.in]: ["waiting", "playing"],
        },
      },
    });

    if (activeGame) {
      return res.status(400).json({ error: "Ya tienes una partida activa" });
    }

    // Crear el juego
    const game = await Game.create({
      player1Id: userId,
      player2Id: isMachineGame ? null : null, // Siempre null inicialmente
      isMachineGame: isMachineGame || false,
      status: isMachineGame ? "playing" : "waiting",
    });

    res.status(201).json({
      message: "Partida creada exitosamente",
      game: {
        id: game.id,
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        status: game.status,
        isMachineGame: game.isMachineGame,
        player1Score: game.player1Score,
        player2Score: game.player2Score,
      },
    });
  } catch (error) {
    console.error("Error al crear partida:", error);
    res.status(500).json({ error: "Error al crear partida" });
  }
};

export const getAvailableGames = async (req, res) => {
  try {
    const games = await Game.findAll({
      where: {
        status: "waiting",
        isMachineGame: false,
      },
      include: [
        {
          model: User,
          as: "player1",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ games });
  } catch (error) {
    console.error("Error al obtener partidas:", error);
    res.status(500).json({ error: "Error al obtener partidas" });
  }
};

export const joinGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // Verificar si el usuario ya tiene una partida activa
    const activeGame = await Game.findOne({
      where: {
        [Op.or]: [{ player1Id: userId }, { player2Id: userId }],
        status: {
          [Op.in]: ["waiting", "playing"],
        },
      },
    });

    if (activeGame) {
      return res.status(400).json({ error: "Ya tienes una partida activa" });
    }

    const game = await Game.findByPk(gameId);

    if (!game) {
      return res.status(404).json({ error: "Partida no encontrada" });
    }

    if (game.status !== "waiting") {
      return res
        .status(400)
        .json({ error: "La partida ya no está disponible" });
    }

    if (game.player1Id === userId) {
      return res
        .status(400)
        .json({ error: "No puedes unirte a tu propia partida" });
    }

    game.player2Id = userId;
    game.status = "playing";
    await game.save();

    res.json({
      message: "Te has unido a la partida",
      game: {
        id: game.id,
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        status: game.status,
        isMachineGame: game.isMachineGame,
        player1Score: game.player1Score,
        player2Score: game.player2Score,
      },
    });
  } catch (error) {
    console.error("Error al unirse a partida:", error);
    res.status(500).json({ error: "Error al unirse a partida" });
  }
};

export const getMyGame = async (req, res) => {
  try {
    const userId = req.user.id;

    const game = await Game.findOne({
      where: {
        [Op.or]: [{ player1Id: userId }, { player2Id: userId }],
        status: {
          [Op.in]: ["waiting", "playing"],
        },
      },
      include: [
        {
          model: User,
          as: "player1",
          attributes: ["id", "username"],
        },
        {
          model: User,
          as: "player2",
          attributes: ["id", "username"],
          required: false,
        },
        {
          model: Round,
          as: "rounds",
          order: [["roundNumber", "ASC"]],
        },
      ],
    });

    if (!game) {
      return res.json({ game: null });
    }

    res.json({ game });
  } catch (error) {
    console.error("Error al obtener partida:", error);
    res.status(500).json({ error: "Error al obtener partida" });
  }
};

export const getRanking = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "wins", "losses", "gamesPlayed"],
      order: [
        [User.sequelize.literal("(wins / GREATEST(gamesPlayed, 1))"), "DESC"],
        ["wins", "DESC"],
      ],
      limit: 10,
    });

    const ranking = users.map((user) => ({
      id: user.id,
      username: user.username,
      wins: user.wins,
      losses: user.losses,
      gamesPlayed: user.gamesPlayed,
      winRate: user.getWinRate(),
    }));

    res.json({ ranking });
  } catch (error) {
    console.error("Error al obtener ranking:", error);
    res.status(500).json({ error: "Error al obtener ranking" });
  }
};
