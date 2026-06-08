/**
 * Virtual try-on image generation via fal.ai.
 *
 * Model: fal-ai/gemini-25-flash-image/edit
 * Docs:  https://fal.ai/models/fal-ai/gemini-25-flash-image/edit/api
 *
 * Returns both base64 (for browser display/download) and the CDN URL
 * (for passing directly to Seedance without re-uploading).
 */

import { fal } from "@fal-ai/client";

export const FAL_IMAGE_MODEL = "fal-ai/gemini-25-flash-image/edit";

export interface TryOnInput {
  modelFrontBase64: string;
  modelBackBase64: string;
  clothFrontBase64: string;
  clothBackBase64: string;
  modelFrontMimeType: string;
  modelBackMimeType: string;
  clothFrontMimeType: string;
  clothBackMimeType: string;
  prompt: string;
}

export interface TryOnResult {
  frontBase64: string;
  backBase64: string;
  frontMimeType: string;
  backMimeType: string;
  frontUrl: string;
  backUrl: string;
}

function configureClient() {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error(
      "FAL_KEY is not set. Add it to .env.local or Vercel environment variables."
    );
  }
  fal.config({ credentials: apiKey });
}

function toDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не вдалося завантажити результат: ${url}`);
  const mimeType = res.headers.get("content-type") ?? "image/png";
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mimeType };
}

async function generateSingleTryOn(
  modelImageBase64: string,
  modelMimeType: string,
  clothImageBase64: string,
  clothMimeType: string,
  prompt: string,
  side: "front" | "back"
): Promise<{ base64: string; mimeType: string; url: string }> {
  const sideLabel = side === "front" ? "спереду" : "ззаду";

  const result = await fal.subscribe(FAL_IMAGE_MODEL, {
    input: {
      prompt: `ПЕРШЕ ФОТО: модель ${sideLabel}. ДРУГЕ ФОТО: одяг ${sideLabel}.\n\n${prompt}`,
      image_urls: [
        toDataUrl(modelImageBase64, modelMimeType),
        toDataUrl(clothImageBase64, clothMimeType),
      ],
      num_images: 1,
      output_format: "png",
      aspect_ratio: "4:5",
    },
    logs: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const imageUrl: string | undefined = data?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error(
      `fal.ai не повернув зображення для ракурсу "${sideLabel}". Відповідь: ${JSON.stringify(data)}`
    );
  }

  const { base64, mimeType } = await urlToBase64(imageUrl);
  return { base64, mimeType, url: imageUrl };
}

export async function generateTryOnImages(input: TryOnInput): Promise<TryOnResult> {
  configureClient();

  const [front, back] = await Promise.all([
    generateSingleTryOn(
      input.modelFrontBase64, input.modelFrontMimeType,
      input.clothFrontBase64, input.clothFrontMimeType,
      input.prompt, "front"
    ),
    generateSingleTryOn(
      input.modelBackBase64, input.modelBackMimeType,
      input.clothBackBase64, input.clothBackMimeType,
      input.prompt, "back"
    ),
  ]);

  return {
    frontBase64: front.base64,
    backBase64: back.base64,
    frontMimeType: front.mimeType,
    backMimeType: back.mimeType,
    frontUrl: front.url,
    backUrl: back.url,
  };
}
