import mongoose from "mongoose";
import { env } from "../config/env.js";
import { UserModel } from "../modules/auth/user.model.js";

async function makeAdmin(email: string) {
  if (!email) {
    console.error("Usage: pnpm tsx src/scripts/make-admin.ts user@example.com");
    process.exit(1);
  }

  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(env.MONGODB_URI);

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User not found with email: ${email}`);
      process.exit(1);
    }

    // Add admin role if not present
    if (!user.roles.includes("admin")) {
      user.roles.push("admin");
      await user.save();
      console.log(`SUCCESS: User ${email} is now an Admin! 🛡️`);
    } else {
      console.log(`INFO: User ${email} is already an Admin.`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error promoting user:", error);
    process.exit(1);
  }
}

// Get email from command line arguments
const emailArg = process.argv[2];
makeAdmin(emailArg);
