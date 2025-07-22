import express from "express";
import subCategoryController from "../controllers/subCategory.controller";
import { auth } from "../../middlewares/authMiddleware";

const subCategoryRouter = express.Router();

// Get all sub category route
subCategoryRouter.get("/", subCategoryController.getAllSubCategories);

// Get a specific sub category by ID
subCategoryRouter.get(
  "/:subCategoryId",
  subCategoryController.getSubCategoryById
);

// Create a new sub category route
subCategoryRouter.post(
  "/create",
  auth({ accountType: ["admin"] }),
  subCategoryController.createSubCategory
);

// Update a sub category by ID route
subCategoryRouter.patch(
  "/update/:subCategoryId",
  auth({ accountType: ["admin"] }),
  subCategoryController.updateSubCategory
);

// Delete a sub category by ID route
subCategoryRouter.delete(
  "/delete/:subCategoryId",
  auth({ accountType: ["admin"] }),
  subCategoryController.deleteSubCategoryById
);

export default subCategoryRouter;
