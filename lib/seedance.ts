export const DEFAULT_SEEDANCE_PROMPT =
  "Create a realistic fashion fit video from the provided front and back images. The model slowly turns from front view to back view, showing the outfit clearly. Keep the same person, body proportions, face, outfit, colors, textures and background. Smooth natural movement, realistic lighting, no distortion, no extra limbs, no face changes, no clothing changes. Commercial product video style, clean and professional.";

const FAL_QUEUE_BASE_URL = process.env.FAL_QUEUE_BASE_URL ?? "https://queue.fal.run";

// За потреби змініть ID моделі через .env.local без правок бізнес-логіки.
export const SEEDANCE_MODEL_ID =
  process.env.SEEDANCE_MODEL_ID ?? "fal-ai/seedance/v1/video-generation";

const POLL_INTERVAL_MS = 3500;
const MAX_POLL_ATTEMPTS = 90;

type SeedanceInput = {
  frontImage: string;
  backImage: string;
  prompt: string;
};

type QueueStartResponse = {
  request_id?: string;
  status_url?: string;
  response_url?: string;
};

function getSeedanceApiKey() {
  return process.env.FAL_KEY ?? process.env.SEEDANCE_API_KEY;
}

function getAuthHeaders(apiKey: string) {
  return {
    Authorization: `Key ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractVideoUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const directCandidates = [
    value.video_url,
    value.url,
    (value.video as { url?: unknown } | undefined)?.url,
    (value.output as { video_url?: unknown } | undefined)?.video_url,
    (value.output as { video?: { url?: unknown } } | undefined)?.video?.url,
    (value.result as { video_url?: unknown } | undefined)?.video_url,
    (value.result as { video?: { url?: unknown } } | undefined)?.video?.url,
    (value.data as { video_url?: unknown } | undefined)?.video_url,
    (value.data as { video?: { url?: unknown } } | undefined)?.video?.url,
  ];

  const matched = directCandidates.find((candidate) => typeof candidate === "string");
  if (typeof matched === "string" && matched.trim()) {
    return matched;
  }

  const videos = value.videos;
  if (Array.isArray(videos)) {
    const firstVideo = videos.find(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as { url?: unknown }).url === "string",
    ) as { url?: string } | undefined;
    if (firstVideo?.url) {
      return firstVideo.url;
    }
  }

  return null;
}

function extractStatus(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const value = payload as Record<string, unknown>;
  const rawStatus = value.status ?? value.state;
  return typeof rawStatus === "string" ? rawStatus.toUpperCase() : "";
}

function extractError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const detail =
    value.detail ??
    (value.error as { message?: unknown } | undefined)?.message ??
    value.message ??
    value.reason;

  return typeof detail === "string" ? detail : null;
}

function buildSeedancePayload(input: SeedanceInput): Record<string, unknown> {
  /**
   * Форма payload для Seedance може змінюватися залежно від конкретної моделі.
   * Залишаємо кілька сумісних полів, щоб endpoint можна було швидко адаптувати.
   */
  return {
    prompt: input.prompt,
    image_urls: [input.frontImage, input.backImage],
    images: [input.frontImage, input.backImage],
    front_image: input.frontImage,
    back_image: input.backImage,
  };
}

async function fetchQueueResult(
  statusUrl: string,
  responseUrl: string | undefined,
  apiKey: string,
): Promise<unknown> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const statusResponse = await fetch(statusUrl, {
      headers: getAuthHeaders(apiKey),
      method: "GET",
    });

    const statusPayload = (await statusResponse.json()) as unknown;
    if (!statusResponse.ok) {
      throw new Error(
        extractError(statusPayload) ?? "Не вдалося перевірити статус генерації відео.",
      );
    }

    const status = extractStatus(statusPayload);
    if (["COMPLETED", "SUCCESS", "DONE"].includes(status)) {
      if (responseUrl) {
        const responseData = await fetch(responseUrl, {
          headers: getAuthHeaders(apiKey),
          method: "GET",
        });
        const resultPayload = (await responseData.json()) as unknown;
        if (!responseData.ok) {
          throw new Error(
            extractError(resultPayload) ?? "Не вдалося отримати результат відеогенерації.",
          );
        }
        return resultPayload;
      }
      return statusPayload;
    }

    if (["FAILED", "ERROR", "CANCELLED"].includes(status)) {
      throw new Error(extractError(statusPayload) ?? "Генерація відео завершилась помилкою.");
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error("Таймаут очікування генерації відео Seedance. Спробуйте ще раз.");
}

export async function generateSeedanceVideo(input: SeedanceInput): Promise<{
  videoUrl: string;
  requestId?: string;
}> {
  const apiKey = getSeedanceApiKey();
  if (!apiKey) {
    throw new Error("Не задано FAL_KEY або SEEDANCE_API_KEY у змінних середовища.");
  }

  const endpoint = `${FAL_QUEUE_BASE_URL}/${SEEDANCE_MODEL_ID}`;
  const startResponse = await fetch(endpoint, {
    method: "POST",
    headers: getAuthHeaders(apiKey),
    body: JSON.stringify(buildSeedancePayload(input)),
  });

  const startPayload = (await startResponse.json()) as QueueStartResponse & {
    detail?: string;
  };
  if (!startResponse.ok) {
    throw new Error(
      startPayload.detail ?? "Не вдалося запустити генерацію Seedance через fal.ai.",
    );
  }

  const statusUrl = startPayload.status_url;
  if (!statusUrl) {
    throw new Error(
      "Seedance API не повернув status_url. Перевірте модель та структуру відповіді у lib/seedance.ts.",
    );
  }

  const resultPayload = await fetchQueueResult(
    statusUrl,
    startPayload.response_url,
    apiKey,
  );
  const videoUrl = extractVideoUrl(resultPayload);
  if (!videoUrl) {
    throw new Error(
      "Seedance повернув відповідь без video URL. Перевірте парсинг у lib/seedance.ts.",
    );
  }

  return {
    videoUrl,
    requestId: startPayload.request_id,
  };
}
