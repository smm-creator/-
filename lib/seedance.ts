/**
 * Seedance 2.0 video generation via fal.ai.
 *
 * Model: bytedance/seedance-2.0/image-to-video
 * Docs:  https://fal.ai/models/bytedance/seedance-2.0/image-to-video
 *
 * Accepts HTTPS image URLs directly (fal.ai CDN URLs from Gemini step).
 * No base64 or storage upload needed — Seedance requires real HTTPS URLs.
 */

import { fal } from "@fal-ai/client";

export const SEEDANCE_MODEL = "bytedance/seedance-2.0/image-to-video";

export interface SeedanceInput {
  frontImageUrl: string;
  backImageUrl: string;
  prompt: string;
}

export interface SeedanceResult {
  videoUrl: string;
}

function configureClient() {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error(
      "FAL_KEY is not set. Add it to .env.local or Vercel environment variables."
    );
  }
  fal.config({ credentials: apiKey });
}

export async function generateFitVideo(
  input: SeedanceInput
): Promise<SeedanceResult> {
  configureClient();

  const result = await fal.subscribe(SEEDANCE_MODEL, {
    input: {
      prompt: input.prompt,
      image_url: input.frontImageUrl,
      end_image_url: input.backImageUrl,
      resolution: "720p",
      duration: 10,
      aspect_ratio: "auto",
      generate_audio: false,
    },
    logs: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const videoUrl = data?.video?.url ?? null;

  if (!videoUrl) {
    throw new Error(
      `Seedance не повернув відео. Відповідь: ${JSON.stringify(data)}`
    );
  }

  return { videoUrl };
}
