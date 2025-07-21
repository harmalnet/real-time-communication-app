import mongoose, { Document, Model, Schema } from "mongoose";

interface IProductImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  image: IProductImage[];
  category: string;
  subCategory: string;
  price: {
    currentPrice: number;
    discountedPrice?: number;
  };

  ratings: {
    averageRating: number;
    totalRatings: number;
  };
  isFeatured: boolean;
  status: "reviewing" | "flagged" | "declined" | "live" | "approved";
  listingLocation: {
    country: string;
    city: string;
  };
  features: string[];
  likes: {
    totalLikes: number;
    likedBy: string[]; // Array of user IDs who liked the product
  };

  seller: string; // User ID
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
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
    image: [
      {
        url: { type: String, required: true },
        altText: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    category: {
      type: String, // Assuming this is a string reference to the category ID
      required: true,
    },
    subCategory: {
      type: String, // Assuming this is a string reference to the subcategory ID
      required: true,
    },
    price: {
      currentPrice: { type: Number, required: true },
      discountedPrice: { type: Number },
    },
    ratings: {
      averageRating: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
    },
    isFeatured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["reviewing", "flagged", "declined", "live", "approved"],
      default: "reviewing",
    },
    listingLocation: {
      country: { type: String, required: true },
      city: { type: String, required: true },
    },
    features: {
      type: [String],
      default: [],
    },
    likes: {
      totalLikes: { type: Number, default: 0 },
      likedBy: { type: [String], default: [] },
    },

    seller: {
      type: String, // Assuming this is a string reference to the user ID
      required: true,
    },
  },
  { timestamps: true }
);
const ProductModel: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  ProductSchema
);

export default ProductModel;
