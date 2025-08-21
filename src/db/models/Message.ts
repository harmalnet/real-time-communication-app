import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface MessageAttributes {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: "text" | "image" | "file";
  isEdited: boolean;
  editedAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, "id" | "messageType" | "isEdited" | "editedAt" | "deliveredAt" | "readAt" | "createdAt" | "updatedAt"> {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public roomId!: string;
  public senderId!: string;
  public content!: string;
  public messageType!: "text" | "image" | "file";
  public isEdited!: boolean;
  public editedAt?: Date;
  public deliveredAt?: Date;
  public readAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initMessageModel = (sequelize: Sequelize) => {
  Message.init(
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
      senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      messageType: {
        type: DataTypes.ENUM("text", "image", "file"),
        defaultValue: "text",
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: "messages",
      timestamps: true,
      indexes: [
        {
          fields: ["roomId", "createdAt"],
        },
        {
          fields: ["senderId"],
        },
      ],
    }
  );
};