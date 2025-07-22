import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  status: "active" | "comingSoon" | "inactive";

  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
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
    status: {
      type: String,
      enum: ["active", "comingSoon", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const CategoryModel: Model<ICategory> =
  mongoose.model<ICategory>("Category", categorySchema);

export default CategoryModel;
