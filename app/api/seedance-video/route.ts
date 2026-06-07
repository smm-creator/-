import { NextRequest, NextResponse } from "next/server";
import { generateFitVideo } from "@/lib/seedance";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      frontImageBase64,
      backImageBase64,
      frontMimeType,
      backMimeType,
      prompt,
    } = body;

    if (!frontImageBase64 || !backImageBase64) {
      return NextResponse.json(
        { error: "Необхідно надати обидва фото (спереду та ззаду)" },
        { status: 400 }
      );
    }

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Промпт для відео не може бути порожнім" },
        { status: 400 }
      );
    }

    const result = await generateFitVideo({
      frontImageBase64,
      backImageBase64,
      frontMimeType: frontMimeType ?? "image/png",
      backMimeType: backMimeType ?? "image/png",
      prompt,
    });

    return NextResponse.json({ videoUrl: result.videoUrl });
  } catch (error) {
    console.error("[seedance-video] Error:", error);
    const message =
      error instanceof Error ? error.message : "Невідома помилка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
