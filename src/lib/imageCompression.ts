/**
 * Production-grade image compression utility
 * Handles JPEG/PNG/WebP compression with proper error handling and diagnostics
 */

export interface CompressionOptions {
  maxDimension: number;
  quality: number;
  maxRetries?: number;
}

export interface CompressionResult {
  success: boolean;
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  dimensions?: { width: number; height: number };
  error?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Load image from File safely with timeout protection
 */
export async function loadImageFile(
  file: File,
  timeoutMs: number = 10000
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Image load timeout")),
      timeoutMs
    );

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      cleanup();
      resolve(image);
    };

    image.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    image.src = objectUrl;
  });
}

/**
 * Calculate optimal dimensions for scaling
 */
export function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): ImageDimensions {
  const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight));
  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
  };
}

/**
 * Convert canvas to blob with error handling
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = "image/jpeg",
  quality: number = 0.8,
  timeoutMs: number = 15000
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Canvas blob conversion timeout (${timeoutMs}ms)`)),
      timeoutMs
    );

    try {
      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout);
          if (!blob) {
            reject(new Error("Canvas toBlob returned null"));
          } else {
            resolve(blob);
          }
        },
        mimeType,
        quality
      );
    } catch (error) {
      clearTimeout(timeout);
      reject(
        new Error(
          `Canvas toBlob error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });
}

/**
 * Core compression function with detailed error handling
 */
export async function compressImageCore(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    // Validate inputs
    if (!file || !(file instanceof File)) {
      throw new Error("Invalid file object");
    }

    if (file.size === 0) {
      throw new Error("File is empty");
    }

    // Check if compression is applicable
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
      ].includes(file.type)
    ) {
      return {
        success: true,
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        quality: 1,
        error: `Unsupported image type: ${file.type}, returning original`,
      };
    }

    // Load image with timeout
    let image: HTMLImageElement;
    try {
      image = await loadImageFile(file, 10000);
    } catch (loadError) {
      throw new Error(
        `Image load failed: ${loadError instanceof Error ? loadError.message : String(loadError)}`
      );
    }

    // Calculate dimensions
    const dimensions = calculateScaledDimensions(
      image.naturalWidth,
      image.naturalHeight,
      options.maxDimension
    );

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Could not get 2D canvas context");
    }

    // Draw image
    try {
      context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
    } catch (drawError) {
      throw new Error(
        `Canvas draw failed: ${drawError instanceof Error ? drawError.message : String(drawError)}`
      );
    }

    // Convert to blob
    let blob: Blob;
    try {
      blob = await canvasToBlob(
        canvas,
        "image/jpeg",
        options.quality,
        15000
      );
    } catch (blobError) {
      throw new Error(
        `Blob conversion failed: ${blobError instanceof Error ? blobError.message : String(blobError)}`
      );
    }

    // Check if compression was effective
    if (blob.size >= originalSize) {
      return {
        success: true,
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        quality: options.quality,
        dimensions,
        error: "Compression resulted in larger file, using original",
      };
    }

    // Create new File from blob
    const newFilename = file.name.replace(
      /\.(heic|heif|jpe?g|png|webp)$/i,
      ".jpg"
    );
    const compressedFile = new File([blob], newFilename, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });

    return {
      success: true,
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      compressionRatio: originalSize / compressedFile.size,
      quality: options.quality,
      dimensions,
      error: undefined,
    };
  } catch (error) {
    return {
      success: false,
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      quality: options.quality,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Adaptive compression with fallback strategy
 * Tries compression levels and falls back on failure
 */
export async function adaptiveCompress(
  file: File,
  targetQualityLevels: number[],
  maxDimension: number
): Promise<File> {
  let lastSuccessfulFile = file;

  for (const quality of targetQualityLevels) {
    try {
      const result = await compressImageCore(file, {
        maxDimension,
        quality,
      });

      if (result.success && result.file.size < file.size) {
        lastSuccessfulFile = result.file;
        console.log(
          `✓ Compression at quality ${quality}: ${result.compressedSize} bytes (${(result.compressionRatio * 100).toFixed(0)}% reduction)`
        );
        break; // Stop at first successful quality level
      }
    } catch (error) {
      console.warn(`Compression attempt at quality ${quality} failed:`, error);
      continue;
    }
  }

  return lastSuccessfulFile;
}

/**
 * Batch compress multiple files with parallel processing
 */
export async function batchCompress(
  files: File[],
  options: CompressionOptions,
  maxConcurrent: number = 3
): Promise<File[]> {
  const results: File[] = [];
  const queue = [...files];

  async function processFile(): Promise<void> {
    if (queue.length === 0) return;
    const file = queue.shift()!;
    try {
      const result = await compressImageCore(file, options);
      results.push(result.file);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      results.push(file);
    }
    await processFile();
  }

  const workers = Array(Math.min(maxConcurrent, files.length))
    .fill(null)
    .map(() => processFile());

  await Promise.all(workers);
  return results;
}

/**
 * Calculate total size of files
 */
export function calculateTotalSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Format bytes for display
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compression report for diagnostics
 */
export interface CompressionReport {
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  failedFiles: number;
  successfulFiles: number;
  totalDuration: number;
}

export function generateCompressionReport(
  results: CompressionResult[]
): CompressionReport {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);

  return {
    totalOriginalSize: totalOriginal,
    totalCompressedSize: totalCompressed,
    averageCompressionRatio: totalOriginal > 0 ? totalOriginal / totalCompressed : 1,
    failedFiles: failed.length,
    successfulFiles: successful.length,
    totalDuration: 0, // Would need to track timing
  };
}
