import { NextRequest, NextResponse } from "next/server";
import { generateFitVideo } from "@/lib/seedance";
import { extractErrorMessage } from "@/lib/utils";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frontImageUrl, backImageUrl, prompt } = body;

    if (!frontImageUrl || !backImageUrl) {
      return NextResponse.json(
        { error: "Необхідно надати обидва URL фото (спереду та ззаду)" },
        { status: 400 }
      );
    }

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Промпт для відео не може бути порожнім" },
        { status: 400 }
      );
    }

    const result = await generateFitVideo({ frontImageUrl, backImageUrl, prompt });
    return NextResponse.json({ videoUrl: result.videoUrl });
  } catch (error) {
    console.error("[seedance-video] Error:", error);
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 });
  }
}
