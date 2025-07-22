/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers"; // Adjust path to your zodHelpers

// Enum for status field
const SubCategoryStatus = z.enum(["active", "comingSoon", "inactive"]);

// Validator for creating a new subcategory
export const createSubCategoryValidator = (payload: any) => {
  const schema = z.object({
    name: z.string({ required_error: "Name is required." }).min(1, "Name cannot be empty."),
    description: z.string().min(1, "Description cannot be empty.").optional(),
    imageUrl: z.string().url("Invalid URL format.").optional(),
    category: z.string({ required_error: "Category ID is required." }).regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID format."), // Validates MongoDB ObjectId
    status: SubCategoryStatus.default("active"), // Optional, defaults to "active"
    facilities: z.array(z.string().min(1, "Facility cannot be empty.")).optional().default([]), // Optional array of non-empty strings
  });

  return validateRequestBody(schema, payload);
};

// Validator for updating an existing subcategory
export const updateSubCategoryValidator = (payload: any) => {
  const schema = z.object({
    name: z.string().min(1, "Name cannot be empty.").optional(),
    slug: z.string().min(1, "Slug cannot be empty.").optional(),
    description: z.string().min(1, "Description cannot be empty.").optional(),
    imageUrl: z.string().url("Invalid URL format.").optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID format.").optional(), // Validates MongoDB ObjectId
    status: SubCategoryStatus.optional(),
    facilities: z.array(z.string().min(1, "Facility cannot be empty.")).optional(),
  });

  return validateRequestBody(schema, payload);
};