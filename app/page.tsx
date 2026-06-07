"use client";

import { useMemo, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ImagePreview } from "@/components/ImagePreview";
import { PromptBox } from "@/components/PromptBox";
import { StepCard } from "@/components/StepCard";
import { VideoPreview } from "@/components/VideoPreview";
import { cn } from "@/lib/utils";

const DEFAULT_GEMINI_PROMPT =
  "Використай фото моделі як основне референс-фото. Збережи обличчя, тіло, позу, пропорції, фон, світло, ракурс і загальний вигляд людини максимально незмінними. Використай фото одягу як референс для нового одягу. Перевдягни модель у цей одяг максимально реалістично. Заміни тільки одяг. Не змінюй обличчя, зачіску, фігуру, фон, колір шкіри, позу та ракурс. Одяг має виглядати природно на тілі, з реалістичними складками, тінями, посадкою і текстурою.";

const DEFAULT_SEEDANCE_PROMPT =
  "Create a realistic fashion fit video from the provided front and back images. The model slowly turns from front view to back view, showing the outfit clearly. Keep the same person, body proportions, face, outfit, colors, textures and background. Smooth natural movement, realistic lighting, no distortion, no extra limbs, no face changes, no clothing changes. Commercial product video style, clean and professional.";

type UploadKey = "frontModel" | "backModel" | "frontClothing" | "backClothing";

type UploadState = {
  file: File | null;
  previewUrl: string | null;
};

type GeminiImages = {
  frontResult: string;
  backResult: string;
};

const EMPTY_UPLOADS: Record<UploadKey, UploadState> = {
  frontModel: { file: null, previewUrl: null },
  backModel: { file: null, previewUrl: null },
  frontClothing: { file: null, previewUrl: null },
  backClothing: { file: null, previewUrl: null }
};

const uploadLabels: Record<UploadKey, { label: string; description: string }> = {
  frontModel: {
    label: "Фото моделі спереду",
    description: "Вихідне фото людини у фронтальному ракурсі."
  },
  backModel: {
    label: "Фото моделі ззаду",
    description: "Вихідне фото людини зі спини."
  },
  frontClothing: {
    label: "Фото одягу спереду",
    description: "Фото товару з сайту у фронтальному ракурсі."
  },
  backClothing: {
    label: "Фото одягу ззаду",
    description: "Фото товару з сайту зі спини."
  }
};

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-500/50 bg-red-950/50 px-4 py-3 text-sm leading-6 text-red-100">
      {message}
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  type = "button"
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      className="rounded-full bg-red-600 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  onClick
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-zinc-100 transition hover:border-red-500 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:text-zinc-600"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [uploads, setUploads] = useState<Record<UploadKey, UploadState>>(EMPTY_UPLOADS);
  const [geminiPrompt, setGeminiPrompt] = useState(DEFAULT_GEMINI_PROMPT);
  const [seedancePrompt, setSeedancePrompt] = useState(DEFAULT_SEEDANCE_PROMPT);
  const [geminiImages, setGeminiImages] = useState<GeminiImages | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [seedanceError, setSeedanceError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isSeedanceLoading, setIsSeedanceLoading] = useState(false);

  const allFilesReady = useMemo(
    () => Object.values(uploads).every((upload) => upload.file && upload.previewUrl),
    [uploads]
  );

  const progress = [
    { label: "Фото", done: allFilesReady },
    { label: "Gemini", done: Boolean(geminiImages) },
    { label: "Seedance", done: Boolean(videoUrl) },
    { label: "YouTube", done: Boolean(youtubeUrl.trim()) }
  ];

  function setUpload(key: UploadKey, file: File, previewUrl: string) {
    setUploads((current) => ({
      ...current,
      [key]: { file, previewUrl }
    }));
    setGeminiError(null);
    setGeminiImages(null);
    setVideoUrl(null);
  }

  function clearUpload(key: UploadKey) {
    setUploads((current) => ({
      ...current,
      [key]: { file: null, previewUrl: null }
    }));
    setGeminiImages(null);
    setVideoUrl(null);
  }

  function resetAll() {
    setUploads(EMPTY_UPLOADS);
    setGeminiPrompt(DEFAULT_GEMINI_PROMPT);
    setSeedancePrompt(DEFAULT_SEEDANCE_PROMPT);
    setGeminiImages(null);
    setVideoUrl(null);
    setYoutubeUrl("");
    setGeminiError(null);
    setSeedanceError(null);
    setCopyMessage(null);
  }

  async function generateGeminiImages() {
    setGeminiError(null);
    setCopyMessage(null);

    if (!allFilesReady) {
      setGeminiError("Завантажте всі 4 фото перед стартом генерації.");
      return;
    }

    if (!geminiPrompt.trim()) {
      setGeminiError("Промпт для Gemini не може бути порожнім.");
      return;
    }

    const formData = new FormData();
    formData.append("prompt", geminiPrompt.trim());

    for (const [key, upload] of Object.entries(uploads) as Array<[UploadKey, UploadState]>) {
      if (upload.file) {
        formData.append(key, upload.file);
      }
    }

    setIsGeminiLoading(true);

    try {
      const response = await fetch("/api/gemini-tryon", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as GeminiImages & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Не вдалося згенерувати фото через Gemini.");
      }

      setGeminiImages({
        frontResult: payload.frontResult,
        backResult: payload.backResult
      });
      setVideoUrl(null);
      setSeedanceError(null);
    } catch (error) {
      setGeminiError(error instanceof Error ? error.message : "Не вдалося згенерувати фото через Gemini.");
    } finally {
      setIsGeminiLoading(false);
    }
  }

  async function generateVideo() {
    setSeedanceError(null);
    setCopyMessage(null);

    if (!geminiImages) {
      setSeedanceError("Спочатку згенеруйте два фото на етапі Gemini.");
      return;
    }

    if (!seedancePrompt.trim()) {
      setSeedanceError("Промпт для Seedance 2.0 не може бути порожнім.");
      return;
    }

    setIsSeedanceLoading(true);

    try {
      const response = await fetch("/api/seedance-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          frontImage: geminiImages.frontResult,
          backImage: geminiImages.backResult,
          prompt: seedancePrompt.trim()
        })
      });
      const payload = (await response.json()) as { videoUrl?: string; error?: string };

      if (!response.ok || !payload.videoUrl) {
        throw new Error(payload.error ?? "Seedance не повернув готове відео.");
      }

      setVideoUrl(payload.videoUrl);
    } catch (error) {
      setSeedanceError(error instanceof Error ? error.message : "Не вдалося згенерувати відео.");
    } finally {
      setIsSeedanceLoading(false);
    }
  }

  async function copyText(text: string, successMessage: string) {
    if (!text.trim()) {
      setCopyMessage("Немає тексту для копіювання.");
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopyMessage(successMessage);
  }

  async function copyFinalResult() {
    const resultText = [
      "FIT VIDEO GENERATOR",
      videoUrl ? `Відео: ${videoUrl}` : null,
      youtubeUrl.trim() ? `YouTube: ${youtubeUrl.trim()}` : null
    ]
      .filter(Boolean)
      .join("\n");

    await copyText(resultText, "Фінальний результат скопійовано.");
  }

  async function copyForRuslana() {
    await copyText(youtubeUrl.trim(), "Посилання для Руслани скопійовано.");
  }

  return (
    <main className="tactical-grid min-h-screen px-4 py-8 text-zinc-100 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-3xl border border-zinc-800 bg-black/70 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-red-400">Tactical production tool</p>
              <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
                FIT VIDEO GENERATOR
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                Перевдягання фото через Gemini та генерація відео через Seedance 2.0
              </p>
            </div>
            <SecondaryButton onClick={resetAll}>Очистити все</SecondaryButton>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {progress.map((item, index) => (
              <div
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  item.done ? "border-red-500 bg-red-950/40" : "border-zinc-800 bg-zinc-950/70"
                )}
                key={item.label}
              >
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Крок {index + 1}</p>
                <p className={cn("mt-1 text-lg font-black", item.done ? "text-red-100" : "text-zinc-200")}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </header>

        <StepCard
          description="Завантажте фото моделі та товару в двох ракурсах. Gemini замінить тільки одяг і збереже людину, фон, світло та позу."
          eyebrow="Етап 1"
          title="Перевдягання фото через Gemini"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {(Object.keys(uploadLabels) as UploadKey[]).map((key) => (
              <FileUpload
                description={uploadLabels[key].description}
                file={uploads[key].file}
                key={key}
                label={uploadLabels[key].label}
                previewUrl={uploads[key].previewUrl}
                onChange={(file, previewUrl) => setUpload(key, file, previewUrl)}
                onClear={() => clearUpload(key)}
              />
            ))}
          </div>

          <div className="mt-5">
            <PromptBox
              description="Цей текст можна змінити перед кожною генерацією."
              label="Промпт для Gemini"
              value={geminiPrompt}
              onChange={setGeminiPrompt}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ActionButton disabled={isGeminiLoading} onClick={generateGeminiImages}>
              {isGeminiLoading ? "Генерація фото..." : geminiImages ? "Повторити генерацію фото" : "Згенерувати фото"}
            </ActionButton>
            <p className="text-sm text-zinc-500">
              Результат: фото спереду та ззаду в новому одязі.
            </p>
          </div>

          <div className="mt-5">
            <ErrorMessage message={geminiError} />
          </div>

          {geminiImages ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ImagePreview filename="gemini-front-result" imageUrl={geminiImages.frontResult} title="Результат спереду" />
              <ImagePreview filename="gemini-back-result" imageUrl={geminiImages.backResult} title="Результат ззаду" />
            </div>
          ) : null}
        </StepCard>

        <StepCard
          description="Другий етап автоматично бере два фото з Gemini: фронтальне фото стає стартовим кадром, фото ззаду — фінальним кадром для Seedance."
          eyebrow="Етап 2"
          title="Генерація відео через Seedance 2.0"
        >
          {geminiImages ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ImagePreview filename="seedance-input-front" imageUrl={geminiImages.frontResult} title="Фото для старту відео" />
              <ImagePreview filename="seedance-input-back" imageUrl={geminiImages.backResult} title="Фото для фіналу відео" />
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-black/45 px-4 py-6 text-sm text-zinc-400">
              Спочатку завершіть етап 1, щоб тут зʼявилися два фото з Gemini.
            </div>
          )}

          <div className="mt-5">
            <PromptBox
              description="Окремий prompt для руху, ракурсу та стилю відео."
              label="Промпт для Seedance 2.0"
              value={seedancePrompt}
              onChange={setSeedancePrompt}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ActionButton disabled={isSeedanceLoading || !geminiImages} onClick={generateVideo}>
              {isSeedanceLoading ? "Генерація відео..." : videoUrl ? "Повторити генерацію відео" : "Згенерувати відео"}
            </ActionButton>
            <p className="text-sm text-zinc-500">Seedance використає front/back кадри для реалістичного fit video.</p>
          </div>

          <div className="mt-5">
            <ErrorMessage message={seedanceError} />
          </div>

          {videoUrl ? (
            <div className="mt-6 space-y-5">
              <VideoPreview videoUrl={videoUrl} />

              <div className="rounded-2xl border border-zinc-800 bg-black/45 p-4">
                <label
                  className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100"
                  htmlFor="youtube-url"
                >
                  Посилання на YouTube
                </label>
                <p className="mt-1 text-sm text-zinc-400">
                  Поле для Вови: вставте URL після завантаження готового відео на YouTube.
                </p>
                <input
                  className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/25"
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  type="url"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <SecondaryButton onClick={copyFinalResult}>Скопіювати фінальний результат</SecondaryButton>
                  <ActionButton disabled={!youtubeUrl.trim()} onClick={copyForRuslana}>
                    Скопіювати посилання для Руслани
                  </ActionButton>
                </div>
                {copyMessage ? <p className="mt-3 text-sm text-red-200">{copyMessage}</p> : null}
              </div>
            </div>
          ) : null}
        </StepCard>
      </div>
    </main>
  );
}
