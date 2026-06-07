import { parseDataUrl } from "@/lib/utils";

export const DEFAULT_GEMINI_PROMPT =
  "Використай фото моделі як основне референс-фото. Збережи обличчя, тіло, позу, пропорції, фон, світло, ракурс і загальний вигляд людини максимально незмінними. Використай фото одягу як референс для нового одягу. Перевдягни модель у цей одяг максимально реалістично. Заміни тільки одяг. Не змінюй обличчя, зачіску, фігуру, фон, колір шкіри, позу та ракурс. Одяг має виглядати природно на тілі, з реалістичними складками, тінями, посадкою і текстурою.";

const GEMINI_BASE_URL =
  process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";

// У випадку зміни моделі достатньо оновити GEMINI_MODEL у .env.local.
const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.0-flash-preview-image-generation";

type GenerateTryOnInput = {
  modelFrontImage: string;
  modelBackImage: string;
  clothFrontImage: string;
  clothBackImage: string;
  prompt: string;
};

type GeminiPayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function extractImageFromGeminiResponse(payload: GeminiPayload): string {
  for (const candidate of payload.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType ?? "image/png";
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  const modelMessage = payload.error?.message ? ` Деталі: ${payload.error.message}` : "";
  throw new Error(
    `Gemini не повернув згенероване зображення. Перевірте модель/endpoint у lib/gemini.ts.${modelMessage}`,
  );
}

async function generateSingleTryOnImage(input: {
  modelImageDataUrl: string;
  clothImageDataUrl: string;
  prompt: string;
  angleLabel: "front" | "back";
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Не задано GEMINI_API_KEY у змінних середовища.");
  }

  const modelImage = parseDataUrl(input.modelImageDataUrl);
  const clothImage = parseDataUrl(input.clothImageDataUrl);

  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  `${input.prompt}\n\n` +
                  `Ракурс для цієї генерації: ${input.angleLabel}. ` +
                  "Поверни лише фотореалістичний результат без зайвих змін.",
              },
              {
                inlineData: {
                  mimeType: modelImage.mimeType,
                  data: modelImage.data,
                },
              },
              {
                inlineData: {
                  mimeType: clothImage.mimeType,
                  data: clothImage.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.3,
        },
      }),
    },
  );

  const payload = (await response.json()) as GeminiPayload;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Помилка під час виклику Gemini API.");
  }

  return extractImageFromGeminiResponse(payload);
}

export async function generateTryOnImages(input: GenerateTryOnInput): Promise<{
  frontResult: string;
  backResult: string;
}> {
  const [frontResult, backResult] = await Promise.all([
    generateSingleTryOnImage({
      modelImageDataUrl: input.modelFrontImage,
      clothImageDataUrl: input.clothFrontImage,
      prompt: input.prompt,
      angleLabel: "front",
    }),
    generateSingleTryOnImage({
      modelImageDataUrl: input.modelBackImage,
      clothImageDataUrl: input.clothBackImage,
      prompt: input.prompt,
      angleLabel: "back",
    }),
  ]);

  return { frontResult, backResult };
}
