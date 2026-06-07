import { NextResponse } from "next/server";
import { generateSeedanceVideo } from "@/lib/seedance";

export const runtime = "nodejs";
export const maxDuration = 300;

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(png|jpeg|jpg|webp);base64,/.test(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Невідома помилка генерації Seedance.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      frontImage?: unknown;
      backImage?: unknown;
      prompt?: unknown;
    };

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Промпт для Seedance 2.0 не може бути порожнім." }, { status: 400 });
    }

    if (!isDataUrl(body.frontImage) || !isDataUrl(body.backImage)) {
      return NextResponse.json(
        { error: "Для генерації відео потрібні два зображення, створені Gemini." },
        { status: 400 }
      );
    }

    const result = await generateSeedanceVideo({
      frontImage: body.frontImage,
      backImage: body.backImage,
      prompt
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
