import sequelize from "../config/database.js";
import User from "./User.js";
import Game from "./Game.js";
import Round from "./Round.js";

// Definir relaciones
User.hasMany(Game, { foreignKey: "player1Id", as: "gamesAsPlayer1" });
User.hasMany(Game, { foreignKey: "player2Id", as: "gamesAsPlayer2" });

Game.belongsTo(User, { foreignKey: "player1Id", as: "player1" });
Game.belongsTo(User, { foreignKey: "player2Id", as: "player2" });
Game.hasMany(Round, { foreignKey: "gameId", as: "rounds" });

Round.belongsTo(Game, { foreignKey: "gameId", as: "game" });

export { sequelize, User, Game, Round };
