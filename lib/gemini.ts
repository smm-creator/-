import { GoogleGenAI, Modality, type Part } from "@google/genai";

const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image-preview";

type TryOnImagePair = {
  modelPhoto: File;
  clothingPhoto: File;
  prompt: string;
  viewLabel: "спереду" | "ззаду";
};

type TryOnResult = {
  frontResult: string;
  backResult: string;
};

async function fileToInlinePart(file: File, displayName: string): Promise<Part> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    inlineData: {
      data: base64,
      displayName,
      mimeType: file.type
    }
  };
}

function extractImageDataUrl(parts: Part[]) {
  const imagePart = parts.find((part) => part.inlineData?.data && part.inlineData.mimeType?.startsWith("image/"));

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini не повернув зображення. Спробуйте уточнити промпт або перевірити модель image generation.");
  }

  const mimeType = imagePart.inlineData.mimeType ?? "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

async function generateTryOnImage({ modelPhoto, clothingPhoto, prompt, viewLabel }: TryOnImagePair) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Не знайдено GEMINI_API_KEY у змінних середовища.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const modelPart = await fileToInlinePart(modelPhoto, `model-${viewLabel}`);
  const clothingPart = await fileToInlinePart(clothingPhoto, `clothing-${viewLabel}`);

  const response = await ai.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              prompt,
              "",
              `Ракурс: ${viewLabel}. Перше зображення - фото моделі, друге зображення - референс одягу.`,
              "Поверни тільки фінальне реалістичне фото моделі в новому одязі."
            ].join("\n")
          },
          modelPart,
          clothingPart
        ]
      }
    ],
    // If Google renames the image model or changes the endpoint, update
    // GEMINI_IMAGE_MODEL in the environment or this single default constant.
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT]
    }
  });

  const parts = response.candidates?.flatMap((candidate) => candidate.content?.parts ?? []) ?? [];

  return extractImageDataUrl(parts);
}

export async function generateGeminiTryOn({
  frontModel,
  backModel,
  frontClothing,
  backClothing,
  prompt
}: {
  frontModel: File;
  backModel: File;
  frontClothing: File;
  backClothing: File;
  prompt: string;
}): Promise<TryOnResult> {
  const [frontResult, backResult] = await Promise.all([
    generateTryOnImage({
      modelPhoto: frontModel,
      clothingPhoto: frontClothing,
      prompt,
      viewLabel: "спереду"
    }),
    generateTryOnImage({
      modelPhoto: backModel,
      clothingPhoto: backClothing,
      prompt,
      viewLabel: "ззаду"
    })
  ]);

  return { frontResult, backResult };
}
