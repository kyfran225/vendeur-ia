import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});

export interface StorageResult {
  url: string;
  provider: "local" | "cloudinary";
  providerId?: string;
  bytes: number;
}

export class StorageService {
  private useCloudinary = false;

  constructor() {
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET
      });
      this.useCloudinary = true;
    }
  }

  async uploadFile(file: Express.Multer.File, folder = "vendeur-ia"): Promise<StorageResult> {
    if (this.useCloudinary) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: "auto"
        });
        return {
          url: result.secure_url,
          provider: "cloudinary",
          providerId: result.public_id,
          bytes: result.bytes
        };
      } catch (error) {
        console.error("Cloudinary upload failed, falling back to local:", error);
      }
    }

    const folderPath = path.join(UPLOADS_DIR, folder);
    await fs.mkdir(folderPath, { recursive: true });
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(folderPath, filename);
    await fs.copyFile(file.path, filePath);

    return {
      url: `${env.API_URL || "http://localhost:" + env.PORT}/uploads/${folder}/${filename}`,
      provider: "local",
      providerId: filename,
      bytes: file.size
    };
  }
}

export const storageService = new StorageService();
