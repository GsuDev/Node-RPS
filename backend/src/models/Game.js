import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Game = sequelize.define(
  "Game",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    player1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    player2Id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("waiting", "playing", "finished", "abandoned"),
      defaultValue: "waiting",
      allowNull: false,
    },
    winnerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isMachineGame: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    player1Score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    player2Score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  },
);

export default Game;
