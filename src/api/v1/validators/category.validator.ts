/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { validateRequestBody } from "../../../utils/zodHelpers";

// Enum for status field
const CategoryStatus = z.enum(["active", "comingSoon", "inactive"]);

// Validator for creating a new category
export const createCategoryValidator = (payload: any) => {
  const schema = z.object({
    name: z.string({ required_error: "Name is required." }).min(1, "Name cannot be empty."),
    description: z.string({ required_error: "Description is required." }).min(1, "Description cannot be empty."),
    imageUrl: z.string({ required_error: "Image URL is required." }).url("Invalid URL format."),
    status: CategoryStatus.default("active"), // Optional, defaults to "active"
  });

  return validateRequestBody(schema, payload);
};

// Validator for updating an existing category
export const updateCategoryValidator = (payload: any) => {
  const schema = z.object({
    name: z.string().min(1, "Name cannot be empty.").optional(),
    slug: z.string().min(1, "Slug cannot be empty.").optional(),
    description: z.string().min(1, "Description cannot be empty.").optional(),
    imageUrl: z.string().url("Invalid URL format.").optional(),
    status: CategoryStatus.optional(),
  });

  return validateRequestBody(schema, payload);
};