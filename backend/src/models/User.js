import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    gamesPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  },
);

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getWinRate = function () {
  if (this.gamesPlayed === 0) return 0;
  return ((this.wins / this.gamesPlayed) * 100).toFixed(2);
};

export default User;
