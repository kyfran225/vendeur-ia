import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { CommerceMerchantModel, CommerceOrderModel, CommerceCustomerModel } from "../modules/commerce/commerce.model.js";
import { commerceService } from "../modules/commerce/commerce.service.js";
import mongoose from "mongoose";

describe("Payment Linking Audit Tests", () => {
  let merchantId: string;
  let customerId: string;

  beforeAll(async () => {
    // Setup minimal DB state if needed
  });

  beforeEach(async () => {
    await CommerceMerchantModel.deleteMany({});
    await CommerceOrderModel.deleteMany({});
    await CommerceCustomerModel.deleteMany({});

    const merchant = await CommerceMerchantModel.create({
      ownerId: "owner_1",
      businessName: "Test Shop",
      category: "fashion"
    });
    merchantId = merchant._id.toString();

    const customer = await CommerceCustomerModel.create({
      merchantId,
      phone: "22501010101",
      name: "Test Customer"
    });
    customerId = customer._id.toString();
  });

  it("should link payment proof to the latest pending order when amount matches", async () => {
    // 1. Create a pending order
    const order = await CommerceOrderModel.create({
      merchantId,
      customerId,
      items: [{ name: "Dress", price: 5000, quantity: 1 }],
      totalAmount: 5000,
      status: "pending"
    });

    // 2. Simulate detected payment info
    const paymentInfo = {
      isPaymentProof: true,
      amount: 5000,
      platform: "Wave",
      transactionId: "TX123"
    };

    // 3. Trigger linking
    const result = await commerceService.linkPaymentToOrder(customerId, paymentInfo);

    expect(result).not.toBeNull();
    expect(result?.matched).toBe(true);
    expect(result?.orderId.toString()).toBe(order._id.toString());

    // 4. Verify order status update
    const updatedOrder = await CommerceOrderModel.findById(order._id);
    expect(updatedOrder?.status).toBe("paid");
    expect(updatedOrder?.paymentMethod).toBe("Wave");
  });

  it("should fail to link if amount mismatch exceeds threshold", async () => {
    await CommerceOrderModel.create({
      merchantId,
      customerId,
      items: [{ name: "Dress", price: 5000, quantity: 1 }],
      totalAmount: 5000,
      status: "pending"
    });

    const paymentInfo = {
      isPaymentProof: true,
      amount: 4500, // Significant difference
      platform: "Orange Money"
    };

    const result = await commerceService.linkPaymentToOrder(customerId, paymentInfo);

    expect(result?.matched).toBe(false);
    expect(result?.expected).toBe(5000);
    expect(result?.actual).toBe(4500);

    const updatedOrder = await CommerceOrderModel.findOne({ customerId });
    expect(updatedOrder?.status).toBe("pending"); // Should remain pending
  });

  it("should tolerate small amount differences (e.g. fees)", async () => {
    await CommerceOrderModel.create({
      merchantId,
      customerId,
      items: [{ name: "Dress", price: 5000, quantity: 1 }],
      totalAmount: 5000,
      status: "pending"
    });

    const paymentInfo = {
      isPaymentProof: true,
      amount: 4950, // 50 XOF difference (allowed up to 100)
      platform: "MTN"
    };

    const result = await commerceService.linkPaymentToOrder(customerId, paymentInfo);
    expect(result?.matched).toBe(true);
  });
});
