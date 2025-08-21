import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface RoomMemberAttributes {
  id: string;
  roomId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomMemberCreationAttributes extends Optional<RoomMemberAttributes, "id" | "joinedAt" | "createdAt" | "updatedAt"> {}

export class RoomMember extends Model<RoomMemberAttributes, RoomMemberCreationAttributes> implements RoomMemberAttributes {
  public id!: string;
  public roomId!: string;
  public userId!: string;
  public role!: "admin" | "member";
  public joinedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initRoomMemberModel = (sequelize: Sequelize) => {
  RoomMember.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "rooms",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      role: {
        type: DataTypes.ENUM("admin", "member"),
        defaultValue: "member",
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
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
      tableName: "room_members",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["roomId", "userId"],
        },
      ],
    }
  );
};