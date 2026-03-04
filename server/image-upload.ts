import { storagePut } from "./storage";

export interface ImageUploadOptions {
  file: Buffer;
  fileName: string;
  diagnosticId: number;
  description?: string;
}

export async function uploadDiagnosticImage(options: ImageUploadOptions): Promise<string> {
  try {
    const fileKey = `diagnostics/${options.diagnosticId}/${Date.now()}-${options.fileName}`;
    const { url } = await storagePut(fileKey, options.file, "image/jpeg");
    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}

export async function uploadMultipleImages(diagnosticId: number, files: Array<{ buffer: Buffer; name: string; description?: string }>): Promise<string[]> {
  const urls: string[] = [];
  
  for (const file of files) {
    const url = await uploadDiagnosticImage({
      file: file.buffer,
      fileName: file.name,
      diagnosticId,
      description: file.description,
    });
    urls.push(url);
  }
  
  return urls;
}
