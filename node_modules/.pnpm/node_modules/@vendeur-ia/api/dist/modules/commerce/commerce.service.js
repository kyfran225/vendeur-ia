import { MerchantModel } from "../merchant.model.js";
import { ProductModel } from "../product.model.js";
import { OrderModel } from "../order.model.js";
import { ConversationModel } from "../conversation.model.js";
import { MessageModel } from "../message.model.js";
import { KnowledgeModel } from "../knowledge.model.js";
export class CommerceService {
    async getDashboard(merchantId) {
        const [merchant, products, orders, conversations] = await Promise.all([
            MerchantModel.findById(merchantId),
            ProductModel.find({ merchantId }),
            OrderModel.find({ merchantId }).sort({ createdAt: -1 }).limit(10),
            ConversationModel.find({ merchantId }).sort({ lastMessageAt: -1 }).limit(10)
        ]);
        return { merchant, products, orders, conversations };
    }
    async addProduct(merchantId, data) {
        return await ProductModel.create({ ...data, merchantId });
    }
    async updateKnowledge(merchantId, data) {
        return await KnowledgeModel.findOneAndUpdate({ merchantId }, { $set: data }, { upsert: true, new: true });
    }
    async getConversations(merchantId) {
        return await ConversationModel.find({ merchantId }).sort({ lastMessageAt: -1 });
    }
    async getMessages(conversationId) {
        return await MessageModel.find({ conversationId }).sort({ timestamp: 1 });
    }
}
export const commerceService = new CommerceService();
