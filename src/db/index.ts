import { Sequelize } from "sequelize";
import { initModels } from "./models";

let sequelize: Sequelize;

export const initMySQL = async (): Promise<void> => {
  try {
    sequelize = new Sequelize(
      process.env.MYSQL_DATABASE as string,
      process.env.MYSQL_USER as string,
      process.env.MYSQL_PASSWORD as string,
      {
        host: process.env.MYSQL_HOST || "127.0.0.1",
        port: Number(process.env.MYSQL_PORT || 3306),
        dialect: "mysql",
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

    await sequelize.authenticate();

    // Initialize models and associations
    initModels(sequelize);

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log("✅ MySQL connected & models synced");
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
    throw err;
  }
};

export const getSequelize = () => {
  if (!sequelize) {
    throw new Error("Sequelize has not been initialized.");
  }
  return sequelize;
};
