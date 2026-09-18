import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
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

  /**
   * Optimizes an image buffer/file: auto-rotates, limits max dimensions to 1200px,
   * and compresses with progressive high-efficiency JPEG.
   */
  async optimizeImage(input: Buffer | string): Promise<{ buffer: Buffer; mimeType: string; extension: string } | null> {
    try {
      const pipeline = sharp(input)
        .rotate() // auto-orient based on EXIF
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true
        })
        .jpeg({
          quality: 82,
          progressive: true,
          mozjpeg: true
        });

      const buffer = await pipeline.toBuffer();
      return {
        buffer,
        mimeType: "image/jpeg",
        extension: "jpg"
      };
    } catch (err: any) {
      console.warn("[StorageService] Image optimization skipped / failed, using original:", err?.message || err);
      return null;
    }
  }

  async uploadFile(file: Express.Multer.File, folder = "vendeur-ia"): Promise<StorageResult> {
    const isImage = (file.mimetype && file.mimetype.startsWith("image/")) ||
                    /\.(jpe?g|png|webp|heic|bmp|tiff)$/i.test(file.originalname || "");

    let fileBuffer: Buffer | null = null;
    let mimeType = file.mimetype || "application/octet-stream";
    let extension = path.extname(file.originalname || "").replace(/^\./, "") || "jpg";

    if (isImage) {
      const optimized = await this.optimizeImage(file.path);
      if (optimized) {
        fileBuffer = optimized.buffer;
        mimeType = optimized.mimeType;
        extension = optimized.extension;
      }
    }

    if (this.useCloudinary) {
      try {
        let result: any;
        if (fileBuffer) {
          const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
          result = await cloudinary.uploader.upload(base64Data, {
            folder,
            resource_type: "auto",
            transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" }]
          });
        } else {
          result = await cloudinary.uploader.upload(file.path, {
            folder,
            resource_type: "auto"
          });
        }
        await fs.unlink(file.path).catch(() => {});
        return {
          url: result.secure_url,
          provider: "cloudinary",
          providerId: result.public_id,
          bytes: result.bytes || (fileBuffer ? fileBuffer.length : file.size)
        };
      } catch (error) {
        console.error("Cloudinary upload failed, falling back to local:", error);
      }
    }

    const folderPath = path.join(UPLOADS_DIR, folder);
    await fs.mkdir(folderPath, { recursive: true });
    const rawBaseName = path.basename(file.originalname || "image.jpg", path.extname(file.originalname || ".jpg"));
    const cleanOrigName = rawBaseName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${cleanOrigName}.${extension}`;
    const filePath = path.join(folderPath, filename);

    if (fileBuffer) {
      await fs.writeFile(filePath, fileBuffer);
    } else {
      await fs.copyFile(file.path, filePath);
    }
    await fs.unlink(file.path).catch(() => {});

    const baseUrl = env.API_URL || (env.CLIENT_URL ? env.CLIENT_URL.replace(/:\d+$/, `:${env.PORT || 3001}`) : `http://localhost:${env.PORT || 3001}`);
    return {
      url: `${baseUrl}/uploads/${folder}/${filename}`,
      provider: "local",
      providerId: filename,
      bytes: fileBuffer ? fileBuffer.length : file.size
    };
  }

  async uploadBuffer(buffer: Buffer, originalname = "file.jpg", mimeType = "image/jpeg", folder = "vendeur-ia"): Promise<StorageResult> {
    const isImage = (mimeType && mimeType.startsWith("image/")) ||
                    /\.(jpe?g|png|webp|heic|bmp|tiff)$/i.test(originalname || "");

    let finalBuffer = buffer;
    let finalMime = mimeType;
    let extension = path.extname(originalname || "").replace(/^\./, "") || "jpg";

    if (isImage) {
      const optimized = await this.optimizeImage(buffer);
      if (optimized) {
        finalBuffer = optimized.buffer;
        finalMime = optimized.mimeType;
        extension = optimized.extension;
      }
    }

    if (this.useCloudinary) {
      try {
        const base64Data = `data:${finalMime};base64,${finalBuffer.toString("base64")}`;
        const uploadOptions: any = {
          folder,
          resource_type: isImage ? "image" : "auto",
        };
        if (isImage) {
          uploadOptions.transformation = [{ width: 1200, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" }];
        }
        const result = await cloudinary.uploader.upload(base64Data, uploadOptions);
        return {
          url: result.secure_url,
          provider: "cloudinary",
          providerId: result.public_id,
          bytes: result.bytes || finalBuffer.length
        };
      } catch (error) {
        console.error("Cloudinary buffer upload failed, falling back to local:", error);
      }
    }

    const folderPath = path.join(UPLOADS_DIR, folder);
    await fs.mkdir(folderPath, { recursive: true });
    const rawBaseName = path.basename(originalname || "file.jpg", path.extname(originalname || ".jpg"));
    const cleanOrigName = rawBaseName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${cleanOrigName}.${extension}`;
    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, finalBuffer);

    const baseUrl = env.API_URL || (env.CLIENT_URL ? env.CLIENT_URL.replace(/:\d+$/, `:${env.PORT || 3001}`) : `http://localhost:${env.PORT || 3001}`);
    return {
      url: `${baseUrl}/uploads/${folder}/${filename}`,
      provider: "local",
      providerId: filename,
      bytes: finalBuffer.length
    };
  }
}

export const storageService = new StorageService();
