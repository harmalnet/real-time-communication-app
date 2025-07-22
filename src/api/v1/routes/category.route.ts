import express from "express";
import categoryController from "../controllers/category.controller";
import { auth } from "../../middlewares/authMiddleware";

const categoryRouter = express.Router();

// Get all category route
categoryRouter.get("/", categoryController.getAllCategories);

// Get a specific category by ID
categoryRouter.get(
  "/:categoryId",
  categoryController.getCategoryById
);

// Create a new caegory route
categoryRouter.post(
  "/create",
  auth({ accountType: ["admin"] }),
  categoryController.createCategory
);

// Update a category by ID route
categoryRouter.patch(
  "/update/:categoryId",
  auth({ accountType: ["admin"] }),
  categoryController.updateCategory
);

// Delete a category by ID route
categoryRouter.delete(
  "/delete/:categoryId",
  auth({ accountType: ["admin"] }),
  categoryController.deleteCategoryById
);

export default categoryRouter;
