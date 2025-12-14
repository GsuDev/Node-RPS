import { Game, Round, User } from "../models/index.js";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

const choices = ["rock", "paper", "scissors"];
const MACHINE_ID = -1; // ID fijo para la máquina

const determineWinner = (choice1, choice2) => {
  if (choice1 === choice2) return "tie";
  if (
    (choice1 === "rock" && choice2 === "scissors") ||
    (choice1 === "scissors" && choice2 === "paper") ||
    (choice1 === "paper" && choice2 === "rock")
  ) {
    return "player1";
  }
  return "player2";
};

const getMachineChoice = () => {
  return choices[Math.floor(Math.random() * choices.length)];
};

export const setupGameSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    // Autenticación del socket
    socket.on("authenticate", async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (user) {
          socket.userId = user.id;
          socket.username = user.username;
          socket.emit("authenticated", {
            userId: user.id,
            username: user.username,
          });

          // Enviar lista de partidas disponibles
          await emitAvailableGames(io);

          // Enviar ranking
          await emitRanking(io);
        } else {
          socket.emit("auth_error", { error: "Usuario no encontrado" });
        }
      } catch (error) {
        socket.emit("auth_error", { error: "Token inválido" });
      }
    });

    // Unirse a la sala de una partida
    socket.on("join_game", async (gameId) => {
      try {
        const game = await Game.findByPk(gameId, {
          include: [
            { model: User, as: "player1", attributes: ["id", "username"] },
            {
              model: User,
              as: "player2",
              attributes: ["id", "username"],
              required: false,
            },
            { model: Round, as: "rounds", order: [["roundNumber", "ASC"]] },
          ],
        });

        if (!game) {
          socket.emit("game_error", { error: "Partida no encontrada" });
          return;
        }

        socket.join(`game-${gameId}`);
        socket.currentGameId = gameId;

        console.log("Usuario", socket.userId, "se unió a partida", gameId);

        // Enviar estado actual del juego
        io.to(`game-${gameId}`).emit("game_update", formatGameData(game));
      } catch (error) {
        console.error("Error al unirse a partida:", error);
        socket.emit("game_error", { error: "Error al unirse a partida" });
      }
    });

    // Realizar jugada
    socket.on("play_round", async ({ gameId, choice }) => {
      try {
        console.log("=== PLAY_ROUND INICIADO ===");
        console.log(
          "Usuario:",
          socket.userId,
          "Jugada:",
          choice,
          "GameId:",
          gameId,
        );

        if (!socket.userId) {
          socket.emit("game_error", { error: "No autenticado" });
          return;
        }

        if (!["rock", "paper", "scissors"].includes(choice)) {
          socket.emit("game_error", { error: "Opción inválida" });
          return;
        }

        const game = await Game.findByPk(gameId, {
          include: [
            { model: User, as: "player1", attributes: ["id", "username"] },
            {
              model: User,
              as: "player2",
              attributes: ["id", "username"],
              required: false,
            },
            { model: Round, as: "rounds" },
          ],
        });

        if (!game) {
          socket.emit("game_error", { error: "Partida no encontrada" });
          return;
        }

        console.log("Game encontrado:", {
          id: game.id,
          isMachineGame: game.isMachineGame,
          player1Id: game.player1Id,
          player2Id: game.player2Id,
          status: game.status,
          roundsCount: game.rounds.length,
        });

        if (game.status !== "playing") {
          socket.emit("game_error", { error: "La partida no está en curso" });
          return;
        }

        // Verificar que la partida no haya terminado ya
        if (game.player1Score >= 3 || game.player2Score >= 3) {
          socket.emit("game_error", { error: "La partida ya ha terminado" });
          return;
        }

        const isPlayer1 = game.player1Id === socket.userId;
        const isPlayer2 =
          game.player2Id === socket.userId || game.isMachineGame;

        console.log("Verificación jugador:", {
          isPlayer1,
          isPlayer2,
          userId: socket.userId,
        });

        if (!isPlayer1 && !isPlayer2) {
          socket.emit("game_error", { error: "No eres parte de esta partida" });
          return;
        }

        // Obtener o crear la ronda actual
        // Buscar si hay una ronda sin completar
        let round = await Round.findOne({
          where: {
            gameId: game.id,
            [Op.or]: [{ player1Choice: null }, { player2Choice: null }],
          },
          order: [["roundNumber", "ASC"]],
        });

        let currentRoundNumber;

        if (round) {
          // Ya existe una ronda sin completar, usarla
          currentRoundNumber = round.roundNumber;
          console.log(
            "Usando ronda existente sin completar:",
            currentRoundNumber,
          );
        } else {
          // Todas las rondas están completas, crear una nueva
          const completedRounds = await Round.count({
            where: {
              gameId: game.id,
              player1Choice: { [Op.not]: null },
              player2Choice: { [Op.not]: null },
            },
          });

          currentRoundNumber = completedRounds + 1;
          console.log(
            "Todas las rondas completas, creando ronda:",
            currentRoundNumber,
          );

          round = await Round.create({
            gameId: game.id,
            roundNumber: currentRoundNumber,
          });
        }

        console.log("Ronda actual:", {
          roundNumber: round.roundNumber,
          player1Choice: round.player1Choice,
          player2Choice: round.player2Choice,
        });

        // Verificar que el jugador no haya jugado ya en esta ronda
        if (isPlayer1 && round.player1Choice) {
          socket.emit("game_error", { error: "Ya has jugado en esta ronda" });
          return;
        }
        if (!isPlayer1 && !game.isMachineGame && round.player2Choice) {
          socket.emit("game_error", { error: "Ya has jugado en esta ronda" });
          return;
        }

        // Guardar la elección del jugador
        if (isPlayer1) {
          console.log("Player1 jugando:", choice);
          round.player1Choice = choice;
          await round.save();
          console.log("Player1 choice guardado");

          // Si es partida contra máquina, generar jugada inmediatamente
          if (game.isMachineGame) {
            const machineChoice = getMachineChoice();
            console.log("Máquina jugando:", machineChoice);
            round.player2Choice = machineChoice;
            await round.save();
            console.log("Máquina choice guardado");
          }
        } else {
          console.log("Player2 jugando:", choice);
          round.player2Choice = choice;
          await round.save();
          console.log("Player2 choice guardado");
        }

        // Recargar el juego con las relaciones actualizadas
        await game.reload({
          include: [
            { model: User, as: "player1", attributes: ["id", "username"] },
            {
              model: User,
              as: "player2",
              attributes: ["id", "username"],
              required: false,
            },
            { model: Round, as: "rounds", order: [["roundNumber", "ASC"]] },
          ],
        });

        console.log("Después de guardar choices:", {
          player1Choice: round.player1Choice,
          player2Choice: round.player2Choice,
          bothPlayed: !!(round.player1Choice && round.player2Choice),
        });

        // Si solo un jugador ha jugado, notificar que está esperando
        if (!round.player1Choice || !round.player2Choice) {
          console.log("Solo un jugador ha jugado, enviando notificación");
          // Notificar al oponente que el jugador ya jugó
          io.to(`game-${gameId}`).emit("opponent_played", {
            message: "Tu oponente ha jugado, es tu turno!",
          });
          io.to(`game-${gameId}`).emit("game_update", formatGameData(game));
          console.log("Eventos enviados, esperando al oponente");
          return;
        }

        console.log("Ambos jugadores han jugado, determinando ganador...");

        // Ambos jugadores han jugado - determinar ganador de la ronda
        const winner = determineWinner(
          round.player1Choice,
          round.player2Choice,
        );

        console.log("Ganador de la ronda:", winner);

        if (winner === "player1") {
          round.winnerId = game.player1Id;
          game.player1Score += 1;
        } else if (winner === "player2") {
          // Si es partida contra máquina, usar MACHINE_ID
          round.winnerId = game.isMachineGame ? MACHINE_ID : game.player2Id;
          game.player2Score += 1;
        } else {
          // Empate explícito
          round.winnerId = null;
        }

        console.log("Scores actualizados:", {
          player1Score: game.player1Score,
          player2Score: game.player2Score,
          winnerId: round.winnerId,
        });

        await round.save();
        await game.save();

        console.log("Round y Game guardados en BD");

        // Verificar si alguien ha ganado la partida (mejor de 5, primero en 3)
        if (game.player1Score >= 3 || game.player2Score >= 3) {
          game.status = "finished";
          // Si es máquina y ganó player2, usar MACHINE_ID
          if (game.player2Score >= 3 && game.isMachineGame) {
            game.winnerId = MACHINE_ID;
          } else {
            game.winnerId =
              game.player1Score >= 3 ? game.player1Id : game.player2Id;
          }
          await game.save();

          // Actualizar estadísticas de los jugadores
          const player1 = await User.findByPk(game.player1Id);
          player1.gamesPlayed += 1;

          if (game.winnerId === game.player1Id) {
            player1.wins += 1;
          } else {
            player1.losses += 1;
          }
          await player1.save();

          if (!game.isMachineGame && game.player2Id) {
            const player2 = await User.findByPk(game.player2Id);
            player2.gamesPlayed += 1;

            if (game.winnerId === game.player2Id) {
              player2.wins += 1;
            } else {
              player2.losses += 1;
            }
            await player2.save();
          }

          // Actualizar ranking
          await emitRanking(io);
          await emitAvailableGames(io);
        }

        // Recargar el juego con las relaciones finales
        await game.reload({
          include: [
            { model: User, as: "player1", attributes: ["id", "username"] },
            {
              model: User,
              as: "player2",
              attributes: ["id", "username"],
              required: false,
            },
            { model: Round, as: "rounds", order: [["roundNumber", "ASC"]] },
          ],
        });

        // Primero enviar el game_update para que el frontend tenga el estado actualizado
        io.to(`game-${gameId}`).emit("game_update", formatGameData(game));

        // Luego enviar el resultado de la ronda con un pequeño delay
        const roundResult = {
          player1Choice: round.player1Choice,
          player2Choice: round.player2Choice,
          winnerId: round.winnerId,
          roundNumber: round.roundNumber,
        };

        console.log("Emitiendo round_result:", roundResult);

        // Delay para asegurar que el frontend procesa game_update primero
        setTimeout(() => {
          io.to(`game-${gameId}`).emit("round_result", roundResult);
          console.log("round_result enviado");
        }, 50);

        console.log("=== PLAY_ROUND COMPLETADO ===\n");
      } catch (error) {
        // Debugging completo
        console.error("❌❌❌ ERROR AL JUGAR RONDA ❌❌❌");
        console.error("Error completo:", error);
        console.error("Stack:", error.stack);
        socket.emit("game_error", {
          error: "Error al procesar jugada: " + error.message,
        });
      }
    });

    // Abandonar partida
    socket.on("abandon_game", async (gameId) => {
      try {
        if (!socket.userId) {
          socket.emit("game_error", { error: "No autenticado" });
          return;
        }

        const game = await Game.findByPk(gameId);

        if (!game) {
          socket.emit("game_error", { error: "Partida no encontrada" });
          return;
        }

        if (
          game.player1Id !== socket.userId &&
          game.player2Id !== socket.userId
        ) {
          socket.emit("game_error", { error: "No eres parte de esta partida" });
          return;
        }

        game.status = "abandoned";

        // El oponente gana
        if (game.player1Id === socket.userId) {
          game.winnerId = game.player2Id;
        } else {
          game.winnerId = game.player1Id;
        }

        await game.save();

        // Actualizar estadísticas
        const abandoningPlayer = await User.findByPk(socket.userId);
        abandoningPlayer.gamesPlayed += 1;
        abandoningPlayer.losses += 1;
        await abandoningPlayer.save();

        if (game.winnerId && !game.isMachineGame) {
          const winningPlayer = await User.findByPk(game.winnerId);
          winningPlayer.gamesPlayed += 1;
          winningPlayer.wins += 1;
          await winningPlayer.save();
        }

        // Recargar y emitir
        await game.reload({
          include: [
            { model: User, as: "player1", attributes: ["id", "username"] },
            {
              model: User,
              as: "player2",
              attributes: ["id", "username"],
              required: false,
            },
            { model: Round, as: "rounds" },
          ],
        });

        io.to(`game-${gameId}`).emit("game_abandoned", formatGameData(game));

        await emitRanking(io);
        await emitAvailableGames(io);
      } catch (error) {
        console.error("Error al abandonar partida:", error);
        socket.emit("game_error", { error: "Error al abandonar partida" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Usuario desconectado:", socket.id);
    });
  });

  // Emitir actualizaciones periódicas
  setInterval(async () => {
    await emitAvailableGames(io);
  }, 5000);
};

const formatGameData = (game) => {
  return {
    id: game.id,
    player1: game.player1
      ? { id: game.player1.id, username: game.player1.username }
      : null,
    player2: game.player2
      ? { id: game.player2.id, username: game.player2.username }
      : game.isMachineGame
        ? { id: MACHINE_ID, username: "Máquina" }
        : null,
    status: game.status,
    isMachineGame: game.isMachineGame,
    player1Score: game.player1Score,
    player2Score: game.player2Score,
    winnerId: game.winnerId,
    rounds: game.rounds
      ? game.rounds.map((r) => ({
          roundNumber: r.roundNumber,
          player1Choice: r.player1Choice,
          player2Choice: r.player2Choice,
          winnerId: r.winnerId,
        }))
      : [],
  };
};

const emitAvailableGames = async (io) => {
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

    io.emit("available_games", { games });
  } catch (error) {
    console.error("Error al emitir partidas disponibles:", error);
  }
};

const emitRanking = async (io) => {
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

    io.emit("ranking_update", { ranking });
  } catch (error) {
    console.error("Error al emitir ranking:", error);
  }
};
