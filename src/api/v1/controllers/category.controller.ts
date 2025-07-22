import { Request, Response } from "express";
import { ResourceNotFound, BadRequest } from "../../../errors/httpErrors";

import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
import GeneratorService from "../../../utils/customIdGeneratorHelpers";
import * as validators from "../validators/category.validator";
import CategoryModel from "../../../db/models/category.model";
import SubCategoryModel from "../../../db/models/subCategory.model";

type QueryParams = {
  startDate?: Date;
  endDate?: Date;
  limit?: string;
  page?: string;
};
class CategoryController {
  async createCategory(req: Request, res: Response) {
    const { error, data } = validators.createCategoryValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { name, description, imageUrl, status } = data;
    const slug = await GeneratorService.generateUniqueSlug(name, "Category");

    // Create the category
    const category = new CategoryModel({
      name,
      slug,
      description,
      imageUrl,
      status,
    });
    const newCategory = await category.save();
    res.created({
      category: newCategory,
      message: "Category created successfully.",
    });
  }

  async updateCategory(req: Request, res: Response) {
    const { categoryId } = req.params;

    const { error, data } = validators.updateCategoryValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    if (data.name || data.slug) {
      data.slug = await GeneratorService.generateUniqueSlug(
        data.name!,
        "Category"
      );
    }
    const updatedCategory = await CategoryModel.findOneAndUpdate(
      {
        _id: categoryId,
      },
      data,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedCategory) {
      throw new ResourceNotFound(
        `Category with ID ${categoryId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }
    res.ok({
      updatedCategory,
      message: "category details updated successfully.",
    });
  }

  async getAllCategories(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const query = await CategoryModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalCategory = await CategoryModel.countDocuments(query);

    res.ok(
      { total: query, totalCategory },
      { page, limit, startDate, endDate }
    );
  }

  async getCategoryById(req: Request, res: Response) {
    const { categoryId } = req.params;
    if (!categoryId) {
      throw new ResourceNotFound(
        "categoryId is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }

    const category = await CategoryModel.findOne({ _id: categoryId });
    if (!category) {
      throw new ResourceNotFound(
        `Category with ID ${categoryId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }
    const subCategories = await SubCategoryModel.find({
      category: categoryId,
    }).sort({ createdAt: -1 });

    res.ok({category, subCategories});
  }

  async deleteCategoryById(req: Request, res: Response) {
    const { categoryId } = req.params;
    if (!categoryId) {
      throw new BadRequest("categoryId is missing.", "MISSING_REQUIRED_FIELD");
    }
    const existingSubCategory = await SubCategoryModel.find({
      category: categoryId,
    });
    if (existingSubCategory.length > 0) {
      throw new BadRequest(
        "Cannot delete category with existing subcategories.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }
    const deletedCategory = await CategoryModel.findOneAndDelete({
      _id: categoryId,
    });
    if (!deletedCategory) {
      throw new ResourceNotFound(
        `category with ID ${categoryId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.noContent();
  }
}

export default new CategoryController();
