import { fal } from "@fal-ai/client";

export const SEEDANCE_MODEL =
  process.env.SEEDANCE_MODEL ?? "bytedance/seedance-2.0/image-to-video";

type SeedanceResult = {
  videoUrl: string;
  requestId: string;
  raw: unknown;
};

function dataUrlToServerBlob(dataUrl: string) {
  const [metadata, base64] = dataUrl.split(",");
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] ?? "image/png";

  if (!base64) {
    throw new Error("Некоректний формат зображення Gemini.");
  }

  return new Blob([Buffer.from(base64, "base64")], { type: mimeType });
}

async function uploadGeneratedImage(dataUrl: string) {
  const blob = dataUrlToServerBlob(dataUrl);
  return fal.storage.upload(blob, {
    lifecycle: {
      expiresIn: "7d"
    }
  });
}

function findVideoUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("url" in value && typeof value.url === "string" && value.url.match(/\.(mp4|mov|webm)(\?|$)/i)) {
    return value.url;
  }

  if ("video" in value) {
    const nested = findVideoUrl(value.video);
    if (nested) {
      return nested;
    }
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const nested = findVideoUrl(item);
        if (nested) {
          return nested;
        }
      }
    } else {
      const nested = findVideoUrl(child);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export async function generateSeedanceVideo({
  frontImage,
  backImage,
  prompt
}: {
  frontImage: string;
  backImage: string;
  prompt: string;
}): Promise<SeedanceResult> {
  const falKey = process.env.FAL_KEY ?? process.env.SEEDANCE_API_KEY;

  if (!falKey) {
    throw new Error("Не знайдено FAL_KEY або SEEDANCE_API_KEY у змінних середовища.");
  }

  fal.config({ credentials: falKey });

  const [frontImageUrl, backImageUrl] = await Promise.all([
    uploadGeneratedImage(frontImage),
    uploadGeneratedImage(backImage)
  ]);

  const result = await fal.subscribe(SEEDANCE_MODEL, {
    input: {
      prompt,
      image_url: frontImageUrl,
      end_image_url: backImageUrl,
      resolution: "720p",
      duration: "auto",
      aspect_ratio: "auto",
      generate_audio: false
    },
    logs: true,
    startTimeout: 120,
    storageSettings: {
      expiresIn: "7d"
    }
  });

  const videoUrl = findVideoUrl(result.data);

  if (!videoUrl) {
    throw new Error("Seedance не повернув URL відео. Перевірте модель або формат відповіді fal.ai.");
  }

  return {
    videoUrl,
    requestId: result.requestId,
    raw: result.data
  };
}
