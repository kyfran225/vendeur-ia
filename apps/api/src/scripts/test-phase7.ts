import "dotenv/config";
import { commerceService } from "../modules/commerce/commerce.service.js";
import { CommerceOrderModel, CommerceCustomerModel, CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function test() {
  await mongoose.connect(env.MONGODB_URI || "mongodb://localhost:27017/vendeur-ia");
  console.log("Connected to MongoDB");

  try {
    let merchant = await CommerceMerchantModel.findOne();
    let customer = await CommerceCustomerModel.findOne();

    if (!merchant) {
      console.log("Creating mock merchant...");
      merchant = await CommerceMerchantModel.create({
        ownerId: "mock_owner",
        businessName: "Boutique de Test",
        category: "fashion"
      });
    }

    if (!customer) {
      console.log("Creating mock customer...");
      customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: "22507000000",
        loyaltyPoints: 5
      });
    }

    console.log(`\n--- Initial Loyalty Points: ${customer.loyaltyPoints} ---`);

    // 1. Create a dummy order
    const order = await CommerceOrderModel.create({
      merchantId: merchant._id,
      customerId: customer._id,
      items: [{ name: "Test Product", price: 5000, quantity: 2 }],
      totalAmount: 10000,
      currency: "XOF",
      status: "pending"
    });

    console.log(`Order created: ${order._id} (Total: 10000 XOF)`);

    // 2. Confirm Payment
    console.log("Confirming payment...");
    await commerceService.confirmOrderPayment(order._id.toString());

    // 3. Check updated points
    const updatedCustomer = await CommerceCustomerModel.findById(customer._id);
    console.log(`Updated Loyalty Points: ${updatedCustomer?.loyaltyPoints} (Expected: ${customer.loyaltyPoints + 10})`);

    // 4. Generate Receipt
    console.log("\n--- Testing Receipt Generation ---");
    const receipt = await commerceService.generateDigitalReceipt(order._id.toString());
    console.log("Generated Receipt:\n", receipt);

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
