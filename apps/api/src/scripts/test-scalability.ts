import { addAIJob } from '../services/ai-queue.service.js';
import { connectDatabase } from '../config/database.js';
import { CommerceMerchantModel, CommerceConversationModel, CommerceCustomerModel } from '../modules/commerce/commerce.model.js';
import mongoose from 'mongoose';

async function testQueue() {
  await connectDatabase();

  const mockMerchant = await CommerceMerchantModel.findOne();
  if (!mockMerchant) {
    console.error("Please create at least one merchant in the DB before running this test.");
    process.exit(1);
  }

  const mockCustomer = await CommerceCustomerModel.create({
    merchantId: mockMerchant._id,
    phone: "test-phone-" + Date.now(),
  });

  const mockConversation = await CommerceConversationModel.create({
    merchantId: mockMerchant._id,
    customerId: mockCustomer._id,
  });

  console.log("🚀 Adding 10 jobs to the AI queue...");

  for (let i = 0; i < 10; i++) {
    await addAIJob({
      userId: mockMerchant.ownerId.toString(),
      conversationId: mockConversation._id.toString(),
      remoteJid: mockCustomer.phone,
      merchant: mockMerchant.toObject() as any,
      products: [],
      knowledge: {} as any,
      history: [],
      message: `Test message ${i}: Quel est le prix de la robe ?`,
      customerPhone: mockCustomer.phone
    });
  }

  console.log("✅ Jobs added. Monitor logs to see workers processing them.");

  // Wait a bit and then exit
  setTimeout(() => {
    console.log("Exiting test script...");
    mongoose.disconnect();
    process.exit(0);
  }, 10000);
}

testQueue().catch(console.error);
