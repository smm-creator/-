/**
 * Gemini API integration for virtual try-on image generation.
 *
 * Uses gemini-2.0-flash-exp with image generation capability (responseModalities: ["IMAGE", "TEXT"]).
 * If Google releases a dedicated try-on endpoint or an updated model, change GEMINI_MODEL below.
 */

import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// Change model here if Google releases a more capable image-generation model
export const GEMINI_MODEL = "gemini-2.0-flash-exp-image-generation";

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
  frontResultBase64: string;
  backResultBase64: string;
  frontMimeType: string;
  backMimeType: string;
}

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or Vercel environment variables."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

async function generateSingleTryOn(
  client: GoogleGenerativeAI,
  modelImageBase64: string,
  modelMimeType: string,
  clothImageBase64: string,
  clothMimeType: string,
  prompt: string,
  side: "front" | "back"
): Promise<{ base64: string; mimeType: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (client.getGenerativeModel as any)({
    model: GEMINI_MODEL,
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  const sideLabel = side === "front" ? "спереду" : "ззаду";

  const parts: Part[] = [
    {
      inlineData: {
        data: modelImageBase64,
        mimeType: modelMimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    },
    {
      inlineData: {
        data: clothImageBase64,
        mimeType: clothMimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    },
    {
      text: `ПЕРШЕ ФОТО: модель ${sideLabel}. ДРУГЕ ФОТО: одяг ${sideLabel}.\n\n${prompt}`,
    },
  ];

  const result = await model.generateContent(parts);
  const response = result.response;

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType ?? "image/png",
        };
      }
    }
  }

  throw new Error(
    `Gemini не повернув зображення для ракурсу "${sideLabel}". Перевірте модель ${GEMINI_MODEL} та API ключ.`
  );
}

export async function generateTryOnImages(
  input: TryOnInput
): Promise<TryOnResult> {
  const client = getClient();

  const [front, back] = await Promise.all([
    generateSingleTryOn(
      client,
      input.modelFrontBase64,
      input.modelFrontMimeType,
      input.clothFrontBase64,
      input.clothFrontMimeType,
      input.prompt,
      "front"
    ),
    generateSingleTryOn(
      client,
      input.modelBackBase64,
      input.modelBackMimeType,
      input.clothBackBase64,
      input.clothBackMimeType,
      input.prompt,
      "back"
    ),
  ]);

  return {
    frontResultBase64: front.base64,
    backResultBase64: back.base64,
    frontMimeType: front.mimeType,
    backMimeType: back.mimeType,
  };
}
