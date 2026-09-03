import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});
await fs.mkdir(path.join(UPLOADS_DIR, "temp"), { recursive: true }).catch(() => {});

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
        await fs.unlink(file.path).catch(() => {});
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
    const cleanOrigName = (file.originalname || "image.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${cleanOrigName}`;
    const filePath = path.join(folderPath, filename);
    await fs.copyFile(file.path, filePath);
    await fs.unlink(file.path).catch(() => {});

    const baseUrl = env.API_URL || (env.CLIENT_URL ? env.CLIENT_URL.replace(/:\d+$/, `:${env.PORT || 3001}`) : `http://localhost:${env.PORT || 3001}`);
    return {
      url: `${baseUrl}/uploads/${folder}/${filename}`,
      provider: "local",
      providerId: filename,
      bytes: file.size
    };
  }

  async uploadBuffer(buffer: Buffer, originalname = "file.jpg", mimeType = "image/jpeg", folder = "vendeur-ia"): Promise<StorageResult> {
    if (this.useCloudinary) {
      try {
        const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(base64Data, {
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
        console.error("Cloudinary buffer upload failed, falling back to local:", error);
      }
    }

    const folderPath = path.join(UPLOADS_DIR, folder);
    await fs.mkdir(folderPath, { recursive: true });
    const cleanOrigName = (originalname || "file.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${cleanOrigName}`;
    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, buffer);

    const baseUrl = env.API_URL || (env.CLIENT_URL ? env.CLIENT_URL.replace(/:\d+$/, `:${env.PORT || 3001}`) : `http://localhost:${env.PORT || 3001}`);
    return {
      url: `${baseUrl}/uploads/${folder}/${filename}`,
      provider: "local",
      providerId: filename,
      bytes: buffer.length
    };
  }
}

export const storageService = new StorageService();
