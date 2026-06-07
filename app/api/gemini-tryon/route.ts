import { NextResponse } from "next/server";
import { DEFAULT_GEMINI_PROMPT, generateTryOnImages } from "@/lib/gemini";
import { fileToDataUrl, normalizeErrorMessage, validateImageFile } from "@/lib/utils";

export const runtime = "nodejs";

function assertFile(value: FormDataEntryValue | null, fieldName: string): File {
  if (!value || !(value instanceof File)) {
    throw new Error(`Поле "${fieldName}" обов'язкове.`);
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const modelFront = assertFile(formData.get("modelFront"), "Фото моделі спереду");
    const modelBack = assertFile(formData.get("modelBack"), "Фото моделі ззаду");
    const clothFront = assertFile(formData.get("clothFront"), "Фото одягу спереду");
    const clothBack = assertFile(formData.get("clothBack"), "Фото одягу ззаду");
    const promptFromUser = formData.get("prompt");
    const prompt =
      typeof promptFromUser === "string" && promptFromUser.trim()
        ? promptFromUser.trim()
        : DEFAULT_GEMINI_PROMPT;

    for (const file of [modelFront, modelBack, clothFront, clothBack]) {
      const validationError = validateImageFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const [modelFrontData, modelBackData, clothFrontData, clothBackData] =
      await Promise.all([
        fileToDataUrl(modelFront),
        fileToDataUrl(modelBack),
        fileToDataUrl(clothFront),
        fileToDataUrl(clothBack),
      ]);

    const result = await generateTryOnImages({
      modelFrontImage: modelFrontData,
      modelBackImage: modelBackData,
      clothFrontImage: clothFrontData,
      clothBackImage: clothBackData,
      prompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: normalizeErrorMessage(error) },
      { status: 500 },
    );
  }
}
