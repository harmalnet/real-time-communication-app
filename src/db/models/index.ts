import { Sequelize } from "sequelize";
import { User, initUserModel } from "./User";
import { Room, initRoomModel } from "./Room";
import { RoomMember, initRoomMemberModel } from "./RoomMember";
import { Message, initMessageModel } from "./Message";

export const initModels = (sequelize: Sequelize) => {
  // Initialize models
  initUserModel(sequelize);
  initRoomModel(sequelize);
  initRoomMemberModel(sequelize);
  initMessageModel(sequelize);

  // Define associations
  User.hasMany(Room, { foreignKey: "createdBy", as: "createdRooms" });
  Room.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

  User.belongsToMany(Room, { through: RoomMember, foreignKey: "userId", as: "rooms" });
  Room.belongsToMany(User, { through: RoomMember, foreignKey: "roomId", as: "members" });

  User.hasMany(RoomMember, { foreignKey: "userId", as: "memberships" });
  RoomMember.belongsTo(User, { foreignKey: "userId", as: "user" });

  Room.hasMany(RoomMember, { foreignKey: "roomId", as: "memberships" });
  RoomMember.belongsTo(Room, { foreignKey: "roomId", as: "room" });

  User.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });
  Message.belongsTo(User, { foreignKey: "senderId", as: "sender" });

  Room.hasMany(Message, { foreignKey: "roomId", as: "messages" });
  Message.belongsTo(Room, { foreignKey: "roomId", as: "room" });
};

export { User, Room, RoomMember, Message };
