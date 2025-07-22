import { Request, Response } from "express";
import { ResourceNotFound, BadRequest } from "../../../errors/httpErrors";

import {
  getLimit,
  getPage,
  getStartDate,
  getEndDate,
} from "../../../utils/dataFilters";
import GeneratorService from "../../../utils/customIdGeneratorHelpers";
import * as validators from "../validators/subCategory.validator";
import CategoryModel from "../../../db/models/category.model";
import SubCategoryModel from "../../../db/models/subCategory.model";
import ProductModel from "../../../db/models/product.model";

type QueryParams = {
  startDate?: Date;
  endDate?: Date;
  limit?: string;
  page?: string;
};
class subCategoryController {
  async createSubCategory(req: Request, res: Response) {
    const { error, data } = validators.createSubCategoryValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);

    const { name, description, imageUrl, status, facilities, category } = data;
    const categoryExists = await CategoryModel.findById(category).exec();
    if (!categoryExists) {
      throw new ResourceNotFound(
        `Category with ID ${category} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }
    const slug = await GeneratorService.generateUniqueSlug(name, "SubCategory");
    // Create the subcategory
    const subCategory = new SubCategoryModel({
      name,
      slug,
      description,
      imageUrl,
      category,
      status,
      facilities,
    });
    const newSubCategory = await subCategory.save();
    res.created({
      subCategory: newSubCategory,
      message: "SubCategory created successfully.",
    });
  }

  async updateSubCategory(req: Request, res: Response) {
    const { subCategoryId } = req.params;
    if (!subCategoryId) {
      throw new BadRequest("subCategoryId is missing.", "MISSING_REQUIRED_FIELD");
    }
    const { error, data } = validators.updateSubCategoryValidator(req.body);
    if (error) throw new BadRequest(error.message, error.code);
    if (data.name || data.slug) {
      data.slug = await GeneratorService.generateUniqueSlug(
        data.name!,
        "SubCategory"
      );
    }
    const updatedSubCategory = await SubCategoryModel.findOneAndUpdate(
      {
        _id: subCategoryId,
      },
      data,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedSubCategory) {
      throw new ResourceNotFound(
        `sub Category with ID ${subCategoryId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }
    res.ok({
      updatedSubCategory,
      message: "sub category details updated successfully.",
    });
  }

  async getAllSubCategories(req: Request, res: Response) {
    const queryParams: QueryParams = req.query;
    const startDate = getStartDate(queryParams.startDate);
    const endDate = getEndDate(queryParams.endDate);
    const limit = getLimit(queryParams.limit);
    const page = getPage(queryParams.page);

    const query = await SubCategoryModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * (page - 1));

    const totalSubCategory = await SubCategoryModel.countDocuments(query);

    res.ok(
      { total: query, totalSubCategory },
      { page, limit, startDate, endDate }
    );
  }

  async getSubCategoryById(req: Request, res: Response) {
    const { subCategoryId } = req.params;
    if (!subCategoryId) {
      throw new ResourceNotFound(
        "subCategoryId is missing.",
        "RESOURCE_NOT_FOUND"
      );
    }

    const subCategory = await SubCategoryModel.findOne({ _id: subCategoryId });
    if (!subCategory) {
      throw new ResourceNotFound(
        `Sub Category with ID ${subCategoryId} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.ok(subCategory);
  }

  async deleteSubCategoryById(req: Request, res: Response) {
    const { subCategoryId } = req.params;
    if (!subCategoryId) {
      throw new BadRequest("subCategoryId is missing.", "MISSING_REQUIRED_FIELD");
    }
    const existingProduct = await ProductModel.find({
      subCategory: subCategoryId,
    });
    if (existingProduct.length > 0) {
      throw new BadRequest(
        "Cannot delete sub category with existing products.",
        "INVALID_REQUEST_PARAMETERS"
      );
    }
    const deletedSubCategory = await SubCategoryModel.findOneAndDelete({
      _id: subCategoryId,
    });
    if (!deletedSubCategory) {
      throw new ResourceNotFound(
        `sub category with ID ${subCategoryController} not found.`,
        "RESOURCE_NOT_FOUND"
      );
    }

    res.noContent();
  }
}

export default new subCategoryController();
