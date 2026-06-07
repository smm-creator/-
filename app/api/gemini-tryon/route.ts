import { NextResponse } from "next/server";
import { generateGeminiTryOn } from "@/lib/gemini";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB, MAX_IMAGE_SIZE_BYTES } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 300;

const REQUIRED_FILES = ["frontModel", "backModel", "frontClothing", "backClothing"] as const;

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function validateUploadedFile(file: File, label: string) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`${label}: підтримуються тільки JPG, PNG або WEBP.`);
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`${label}: файл завеликий. Максимальний розмір — ${MAX_IMAGE_SIZE_MB} МБ.`);
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Невідома помилка генерації Gemini.";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const prompt = String(formData.get("prompt") ?? "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Промпт для Gemini не може бути порожнім." }, { status: 400 });
    }

    const files = Object.fromEntries(
      REQUIRED_FILES.map((fieldName) => {
        const value = formData.get(fieldName);

        if (!isUploadedFile(value)) {
          throw new Error("Завантажте всі 4 фото перед генерацією.");
        }

        validateUploadedFile(value, fieldName);
        return [fieldName, value];
      })
    ) as Record<(typeof REQUIRED_FILES)[number], File>;

    const result = await generateGeminiTryOn({
      frontModel: files.frontModel,
      backModel: files.backModel,
      frontClothing: files.frontClothing,
      backClothing: files.backClothing,
      prompt
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
