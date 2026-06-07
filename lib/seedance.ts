/**
 * Seedance 2.0 video generation via fal.ai.
 *
 * Model: bytedance/seedance-2.0/image-to-video
 * Docs:  https://fal.ai/models/bytedance/seedance-2.0/image-to-video
 *
 * Fast variant: bytedance/seedance-2.0/fast/image-to-video (cheaper, ~80% якості)
 * To switch, change SEEDANCE_MODEL below.
 */

import { fal } from "@fal-ai/client";

export const SEEDANCE_MODEL = "bytedance/seedance-2.0/image-to-video";

export interface SeedanceInput {
  frontImageBase64: string;
  backImageBase64: string;
  frontMimeType: string;
  backMimeType: string;
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

function toDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export async function generateFitVideo(
  input: SeedanceInput
): Promise<SeedanceResult> {
  configureClient();

  const result = await fal.subscribe(SEEDANCE_MODEL, {
    input: {
      prompt: input.prompt,
      image_url: toDataUrl(input.frontImageBase64, input.frontMimeType),
      end_image_url: toDataUrl(input.backImageBase64, input.backMimeType),
      resolution: "720p",
      duration: "5",
      aspect_ratio: "auto",
      generate_audio: false,
    },
    logs: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  const videoUrl =
    data?.video?.url ??
    data?.video_url ??
    data?.output?.video?.url ??
    null;

  if (!videoUrl) {
    throw new Error(
      `Seedance не повернув відео. Відповідь: ${JSON.stringify(data)}`
    );
  }

  return { videoUrl };
}
