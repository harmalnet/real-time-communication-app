import { DataTypes, Model, Optional, Sequelize, Op } from "sequelize";

interface RoomAttributes {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomCreationAttributes extends Optional<RoomAttributes, "id" | "description" | "inviteCode" | "createdAt" | "updatedAt"> {}

export class Room extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public isPrivate!: boolean;
  public inviteCode?: string;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initRoomModel = (sequelize: Sequelize) => {
  Room.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      inviteCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "rooms",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["inviteCode"],
          where: {
            inviteCode: {
              [Op.ne]: null,
            },
          },
        },
      ],
    }
  );
};