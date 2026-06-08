export const MAX_FILE_SIZE_MB = 4;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Непідтримуваний формат. Дозволені: JPG, PNG, WEBP`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Файл занадто великий. Максимум: ${MAX_FILE_SIZE_MB} МБ`;
  }
  return null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Помилка читання файлу"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file to a target max dimension and quality.
 * Reduces large photos before sending to the API to stay under Vercel's
 * 4.5 MB request body limit (4 photos × ~1 MB each).
 */
export function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => reject(new Error("Помилка обробки зображення"));
    img.src = url;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Помилка читання файлу"));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function downloadBase64Image(
  base64: string,
  mimeType: string,
  filename: string
): void {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadFromUrl(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Extracts a human-readable message from any thrown value.
 * Handles: Error instances, fal.ai ApiError (which stores details in .body),
 * plain objects, and strings.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // fal.ai ApiError has a .body property with API details
    const body = (error as Error & { body?: unknown; status?: number }).body;
    if (body) {
      if (typeof body === "string") return body;
      if (typeof body === "object" && body !== null) {
        const b = body as Record<string, unknown>;
        const detail =
          b.detail ?? b.message ?? b.error ?? b.msg ?? b.reason;
        if (detail) {
          if (typeof detail === "string") return detail;
          return JSON.stringify(detail);
        }
        return JSON.stringify(body);
      }
    }
    if (error.message && error.message !== "[object Object]") {
      return error.message;
    }
    return "Помилка сервера fal.ai. Перевірте FAL_KEY та баланс на рахунку.";
  }
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error);
  }
  return "Невідома помилка";
}
