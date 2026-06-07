/**
 * Gemini API integration for virtual try-on image generation.
 *
 * SDK: @google/genai (new unified Google Gen AI SDK)
 * Model: gemini-3.1-flash-image — supports image input + image output.
 * To switch to a pro model, change GEMINI_MODEL to "gemini-3-pro-image".
 */

import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.1-flash-image";

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

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or Vercel environment variables."
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function generateSingleTryOn(
  ai: GoogleGenAI,
  modelImageBase64: string,
  modelMimeType: string,
  clothImageBase64: string,
  clothMimeType: string,
  prompt: string,
  side: "front" | "back"
): Promise<{ base64: string; mimeType: string }> {
  const sideLabel = side === "front" ? "спереду" : "ззаду";

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: modelMimeType,
              data: modelImageBase64,
            },
          },
          {
            inlineData: {
              mimeType: clothMimeType,
              data: clothImageBase64,
            },
          },
          {
            text: `ПЕРШЕ ФОТО: модель ${sideLabel}. ДРУГЕ ФОТО: одяг ${sideLabel}.\n\n${prompt}`,
          },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }

  throw new Error(
    `Gemini не повернув зображення для ракурсу "${sideLabel}". Модель: ${GEMINI_MODEL}`
  );
}

export async function generateTryOnImages(
  input: TryOnInput
): Promise<TryOnResult> {
  const ai = getClient();

  const [front, back] = await Promise.all([
    generateSingleTryOn(
      ai,
      input.modelFrontBase64,
      input.modelFrontMimeType,
      input.clothFrontBase64,
      input.clothFrontMimeType,
      input.prompt,
      "front"
    ),
    generateSingleTryOn(
      ai,
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
