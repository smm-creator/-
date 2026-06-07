/**
 * Seedance 2.0 video generation via fal.ai.
 *
 * Model: "fal-ai/bytedance/seedance-1-5-image-to-video" — change SEEDANCE_MODEL below
 * if ByteDance publishes a newer model slug or if fal.ai updates the endpoint.
 *
 * fal.ai docs: https://fal.ai/models
 */

import { fal } from "@fal-ai/client";

// Update this constant to switch to a newer Seedance model when available
export const SEEDANCE_MODEL = "fal-ai/bytedance/seedance-1-5-image-to-video";

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

function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export async function generateFitVideo(
  input: SeedanceInput
): Promise<SeedanceResult> {
  configureClient();

  const frontDataUrl = base64ToDataUrl(
    input.frontImageBase64,
    input.frontMimeType
  );
  const backDataUrl = base64ToDataUrl(
    input.backImageBase64,
    input.backMimeType
  );

  /**
   * Seedance image-to-video accepts a single image_url.
   * We pass the front image as the primary frame and the back image as end_image_url.
   * The prompt describes the turn-around motion.
   * If the model starts supporting multi-frame input, update this payload.
   */
  const result = await fal.subscribe(SEEDANCE_MODEL, {
    input: {
      image_url: frontDataUrl,
      end_image_url: backDataUrl,
      prompt: input.prompt,
      duration: 5,
      resolution: "720p",
      motion_scale: 0.7,
    },
    logs: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = result.data as any;
  const videoUrl =
    output?.video?.url ??
    output?.video_url ??
    output?.output?.video?.url ??
    null;

  if (!videoUrl) {
    throw new Error(
      `Seedance не повернув відео. Відповідь: ${JSON.stringify(output)}`
    );
  }

  return { videoUrl };
}
