import mongoose, { Schema } from "mongoose";
const ProductSchema = new Schema({
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "XOF" },
    images: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    availability: { type: String, enum: ["available", "limited", "sold_out", "hidden"], default: "available" },
    aiMetadata: {
        tags: [{ type: String }],
        tiktokCaption: { type: String }
    }
}, { timestamps: true });
export const ProductModel = mongoose.model("Product", ProductSchema);
