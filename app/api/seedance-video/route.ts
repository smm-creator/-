import { NextResponse } from "next/server";
import { DEFAULT_SEEDANCE_PROMPT, generateSeedanceVideo } from "@/lib/seedance";
import { normalizeErrorMessage } from "@/lib/utils";

export const runtime = "nodejs";

type SeedanceRequest = {
  frontImage?: string;
  backImage?: string;
  prompt?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SeedanceRequest;
    const frontImage = payload.frontImage?.trim();
    const backImage = payload.backImage?.trim();
    const prompt = payload.prompt?.trim() || DEFAULT_SEEDANCE_PROMPT;

    if (!frontImage || !backImage) {
      return NextResponse.json(
        { error: "Потрібно передати обидва зображення (frontImage і backImage)." },
        { status: 400 },
      );
    }

    const result = await generateSeedanceVideo({
      frontImage,
      backImage,
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
