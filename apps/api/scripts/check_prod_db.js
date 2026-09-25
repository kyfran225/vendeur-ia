import mongoose from "mongoose";

const PROD_URI = "mongodb+srv://kyfran6_db_user:zLURzo9I8rSAaefW@vendeuriacluster.uyo7eob.mongodb.net/vendeuria-prod?retryWrites=true&w=majority&appName=VendeuriaCluster";

async function main() {
  try {
    await mongoose.connect(PROD_URI);
    console.log("Connected to MongoDB Prod!");

    const db = mongoose.connection.db;

    // 1. Find recent orders
    const ordersCollection = db.collection("commerceorders");
    const recentOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log("=== RECENT ORDERS ===");
    console.log(JSON.stringify(recentOrders, null, 2));

    // 2. Find customer by phone 22505111157
    const customersCollection = db.collection("commercecustomers");
    const customer = await customersCollection.findOne({
      $or: [
        { phone: /22505111157/ },
        { platformId: /22505111157/ },
        { whatsappNumber: /22505111157/ }
      ]
    });
    console.log("=== CUSTOMER ===");
    console.log(JSON.stringify(customer, null, 2));

    if (recentOrders.length > 0) {
      const merchantId = recentOrders[0].merchantId;
      // 3. Find products for this merchant
      const productsCollection = db.collection("commerceproducts");
      const products = await productsCollection.find({ merchantId }).toArray();
      console.log("=== PRODUCTS FOR MERCHANT ===");
      console.log(JSON.stringify(products, null, 2));

      // 4. Find conversation for this merchant / customer
      if (recentOrders[0].conversationId) {
        const messagesCollection = db.collection("commercemessages");
        const messages = await messagesCollection.find({ conversationId: recentOrders[0].conversationId }).sort({ createdAt: -1 }).limit(10).toArray();
        console.log("=== RECENT MESSAGES IN CONVERSATION ===");
        console.log(JSON.stringify(messages, null, 2));
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
