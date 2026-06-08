import { NextRequest, NextResponse } from "next/server";
import { generateTryOnImages } from "@/lib/gemini";
import { extractErrorMessage } from "@/lib/utils";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      modelFrontBase64, modelBackBase64,
      clothFrontBase64, clothBackBase64,
      modelFrontMimeType, modelBackMimeType,
      clothFrontMimeType, clothBackMimeType,
      prompt,
    } = body;

    if (!modelFrontBase64 || !modelBackBase64 || !clothFrontBase64 || !clothBackBase64) {
      return NextResponse.json({ error: "Необхідно надати всі 4 фотографії" }, { status: 400 });
    }

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Промпт не може бути порожнім" }, { status: 400 });
    }

    const result = await generateTryOnImages({
      modelFrontBase64, modelBackBase64,
      clothFrontBase64, clothBackBase64,
      modelFrontMimeType: modelFrontMimeType ?? "image/jpeg",
      modelBackMimeType: modelBackMimeType ?? "image/jpeg",
      clothFrontMimeType: clothFrontMimeType ?? "image/jpeg",
      clothBackMimeType: clothBackMimeType ?? "image/jpeg",
      prompt,
    });

    return NextResponse.json({
      frontResult: result.frontBase64,
      backResult: result.backBase64,
      frontMimeType: result.frontMimeType,
      backMimeType: result.backMimeType,
      frontUrl: result.frontUrl,
      backUrl: result.backUrl,
    });
  } catch (error) {
    console.error("[gemini-tryon] Error:", error);
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
  }
}
