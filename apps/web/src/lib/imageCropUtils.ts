/**
 * Utility to crop and auto-enhance sub-images from a multi-product photo using bounding box coordinates (box_2d: [ymin, xmin, ymax, xmax]).
 */

export interface Box2D {
  0: number; // ymin
  1: number; // xmin
  2: number; // ymax
  3: number; // xmax
}

/**
 * Crops a sub-region of an image specified by normalized box2d coordinates [ymin, xmin, ymax, xmax] (0 to 1000 or 0.0 to 1.0).
 * Adds padding around the box and applies visual enhancement (contrast/saturation) for a clean studio result.
 */
export async function cropAndEnhanceProductImage(
  sourceImageSrc: string,
  box2d?: number[] | null,
  options: {
    paddingPercent?: number; // Extra margin around box (e.g. 0.08 = 8%)
    targetWidth?: number;
    enhance?: boolean;
  } = {}
): Promise<string> {
  const { paddingPercent = 0.08, targetWidth = 800, enhance = true } = options;

  if (!sourceImageSrc) return "";

  // If no bounding box supplied or invalid array length, return original image
  if (!box2d || !Array.isArray(box2d) || box2d.length < 4) {
    return sourceImageSrc;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        if (origWidth === 0 || origHeight === 0) {
          return resolve(sourceImageSrc);
        }

        let [ymin, xmin, ymax, xmax] = box2d;

        // Normalize if coordinates are 0..1000 scale instead of 0..1
        if (ymax > 1.5 || xmax > 1.5) {
          ymin = ymin / 1000;
          xmin = xmin / 1000;
          ymax = ymax / 1000;
          xmax = xmax / 1000;
        }

        // Clamp normalized bounds
        ymin = Math.max(0, Math.min(1, ymin));
        xmin = Math.max(0, Math.min(1, xmin));
        ymax = Math.max(0, Math.min(1, ymax));
        xmax = Math.max(0, Math.min(1, xmax));

        // Calculate box dimensions in pixels
        let boxX = xmin * origWidth;
        let boxY = ymin * origHeight;
        let boxW = (xmax - xmin) * origWidth;
        let boxH = (ymax - ymin) * origHeight;

        // If bounding box is degenerate or extremely small (< 2% of image), fallback
        if (boxW < origWidth * 0.02 || boxH < origHeight * 0.02) {
          return resolve(sourceImageSrc);
        }

        // Apply padding
        const padX = boxW * paddingPercent;
        const padY = boxH * paddingPercent;

        const cropX = Math.max(0, boxX - padX);
        const cropY = Math.max(0, boxY - padY);
        const cropW = Math.min(origWidth - cropX, boxW + padX * 2);
        const cropH = Math.min(origHeight - cropY, boxH + padY * 2);

        // Prepare destination Canvas
        const canvas = document.createElement("canvas");
        const aspectRatio = cropW / cropH;
        canvas.width = targetWidth;
        canvas.height = Math.round(targetWidth / aspectRatio);

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(sourceImageSrc);

        // Optional studio enhancement filters
        if (enhance) {
          ctx.filter = "saturate(1.15) brightness(1.04) contrast(1.06)";
        }

        // Draw cropped portion from original image onto target canvas
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Return high quality WebP/JPEG data URL
        const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(croppedDataUrl);
      } catch (err) {
        console.warn("[imageCropUtils] Error cropping product image:", err);
        resolve(sourceImageSrc);
      }
    };

    img.onerror = () => {
      resolve(sourceImageSrc);
    };

    img.src = sourceImageSrc;
  });
}
