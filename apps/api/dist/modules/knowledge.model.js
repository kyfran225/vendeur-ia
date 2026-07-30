import mongoose, { Schema } from "mongoose";
const KnowledgeSchema = new Schema({
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true, unique: true },
    deliveryZones: [{ type: String }],
    openingHours: { type: String, default: "" },
    returnPolicy: { type: String, default: "" },
    faq: [{
            question: { type: String, required: true },
            answer: { type: String, required: true }
        }],
    customInstructions: { type: String, default: "" }
}, { timestamps: true });
export const KnowledgeModel = mongoose.model("Knowledge", KnowledgeSchema);
