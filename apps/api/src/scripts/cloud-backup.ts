import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

async function runBackup() {
  const BACKUP_DIR = path.resolve(process.cwd(), "backups");
  const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
  const BACKUP_NAME = `vendeur_ia_backup_${TIMESTAMP}.gz`;
  const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_NAME);

  // 1. Ensure backup directory exists
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  console.log(`🚀 Starting MongoDB Backup: ${BACKUP_NAME}`);

  try {
    // 2. Run mongodump
    // We use --archive to create a single compressed file
    const mongoUri = env.MONGODB_URI;
    execSync(`mongodump --uri="${mongoUri}" --archive="${BACKUP_PATH}" --gzip`);
    console.log("✅ mongodump successful.");

    // 3. Upload to Cloudinary (or another cloud provider)
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      console.log("☁️ Uploading to Cloudinary...");
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET
      });

      const result = await cloudinary.uploader.upload(BACKUP_PATH, {
        resource_type: "raw",
        folder: "vendeuria/backups",
        public_id: BACKUP_NAME
      });

      console.log("✨ Upload successful!");
      console.log(`🔗 URL: ${result.secure_url}`);

      // 4. Cleanup local file after successful upload
      await fs.unlink(BACKUP_PATH);
      console.log("🧹 Local backup file removed.");
    } else {
      console.warn("⚠️ Cloudinary not configured. Backup remains local at:", BACKUP_PATH);
    }
  } catch (error) {
    console.error("❌ Backup process failed:", error);
    process.exit(1);
  }
}

runBackup().then(() => {
  console.log("🎯 Backup task finished.");
  process.exit(0);
});
