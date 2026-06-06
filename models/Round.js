import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Round = sequelize.define(
  "Round",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Games",
        key: "id",
      },
    },
    roundNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    player1Choice: {
      type: DataTypes.ENUM("rock", "paper", "scissors"),
      allowNull: true,
    },
    player2Choice: {
      type: DataTypes.ENUM("rock", "paper", "scissors"),
      allowNull: true,
    },
    winnerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // Eliminamos la foreign key para permitir valores especiales como -1
      // references: {
      //   model: 'Users',
      //   key: 'id'
      // }
    },
  },
  {
    timestamps: true,
  },
);

export default Round;
