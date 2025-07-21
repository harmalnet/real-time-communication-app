import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubCategory extends Document {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  category: string; // Reference to the parent category
  status: "active" | "comingSoon" | "inactive";
  facilities?: string[]; // Optional array of facilities associated with the subcategory
  createdAt?: Date;
  updatedAt?: Date;
}

const subCategorySchema = new Schema<ISubCategory>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String, // Assuming this is a string reference to the category ID
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "comingSoon", "inactive"],
      default: "active",
    },
    facilities: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);
const SubCategoryModel: Model<ISubCategory> = mongoose.model<ISubCategory>(
  "SubCategory",
  subCategorySchema
);

export default SubCategoryModel;
