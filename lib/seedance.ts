/**
 * Seedance 2.0 video generation via fal.ai.
 *
 * Model: bytedance/seedance-2.0/image-to-video
 * Docs:  https://fal.ai/models/bytedance/seedance-2.0/image-to-video
 *
 * Fast variant: bytedance/seedance-2.0/fast/image-to-video (cheaper, ~80% quality)
 * To switch, change SEEDANCE_MODEL below.
 *
 * NOTE: Seedance requires real HTTPS URLs for image_url — data: URIs are rejected.
 * Images are first uploaded to fal.ai Storage, then the returned URLs are passed.
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

function base64ToFile(base64: string, mimeType: string, filename: string): File {
  const bytes = Buffer.from(base64, "base64");
  const blob = new Blob([bytes], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

async function uploadToStorage(base64: string, mimeType: string, filename: string): Promise<string> {
  const file = base64ToFile(base64, mimeType, filename);
  const url = await fal.storage.upload(file);
  return url;
}

export async function generateFitVideo(
  input: SeedanceInput
): Promise<SeedanceResult> {
  configureClient();

  // Upload both images to fal.ai Storage to get real HTTPS URLs
  const [frontUrl, backUrl] = await Promise.all([
    uploadToStorage(input.frontImageBase64, input.frontMimeType, "front.jpg"),
    uploadToStorage(input.backImageBase64, input.backMimeType, "back.jpg"),
  ]);

  const result = await fal.subscribe(SEEDANCE_MODEL, {
    input: {
      prompt: input.prompt,
      image_url: frontUrl,
      end_image_url: backUrl,
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
