"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ImagePreview } from "@/components/ImagePreview";
import { PromptBox } from "@/components/PromptBox";
import { StepCard } from "@/components/StepCard";
import { VideoPreview } from "@/components/VideoPreview";
import { DEFAULT_GEMINI_PROMPT } from "@/lib/gemini";
import { DEFAULT_SEEDANCE_PROMPT } from "@/lib/seedance";
import { cn, validateImageFile } from "@/lib/utils";

type UploadField = "modelFront" | "modelBack" | "clothFront" | "clothBack";

type GeminiResult = {
  frontResult: string;
  backResult: string;
};

const uploadConfig: Array<{
  key: UploadField;
  title: string;
  subtitle: string;
}> = [
  {
    key: "modelFront",
    title: "Фото моделі спереду",
    subtitle: "Вихідне фото людини (front)",
  },
  {
    key: "modelBack",
    title: "Фото моделі ззаду",
    subtitle: "Вихідне фото людини (back)",
  },
  {
    key: "clothFront",
    title: "Фото одягу спереду",
    subtitle: "Фото товару з сайту (front)",
  },
  {
    key: "clothBack",
    title: "Фото одягу ззаду",
    subtitle: "Фото товару з сайту (back)",
  },
];

const emptyUploads: Record<UploadField, File | null> = {
  modelFront: null,
  modelBack: null,
  clothFront: null,
  clothBack: null,
};

const emptyPreviews: Record<UploadField, string | null> = {
  modelFront: null,
  modelBack: null,
  clothFront: null,
  clothBack: null,
};

export default function Home() {
  const [uploads, setUploads] = useState<Record<UploadField, File | null>>(emptyUploads);
  const [uploadPreviews, setUploadPreviews] =
    useState<Record<UploadField, string | null>>(emptyPreviews);
  const [geminiPrompt, setGeminiPrompt] = useState(DEFAULT_GEMINI_PROMPT);
  const [seedancePrompt, setSeedancePrompt] = useState(DEFAULT_SEEDANCE_PROMPT);
  const [geminiResult, setGeminiResult] = useState<GeminiResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [seedanceError, setSeedanceError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isSeedanceLoading, setIsSeedanceLoading] = useState(false);
  const step2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      Object.values(uploadPreviews).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [uploadPreviews]);

  const allImagesSelected = useMemo(
    () => Object.values(uploads).every((file) => file instanceof File),
    [uploads],
  );

  const progressItems = useMemo(
    () => [
      { label: "Фото", done: allImagesSelected },
      { label: "Gemini", done: Boolean(geminiResult) },
      { label: "Seedance", done: Boolean(videoUrl) },
      { label: "YouTube", done: youtubeLink.trim().length > 0 },
    ],
    [allImagesSelected, geminiResult, videoUrl, youtubeLink],
  );

  const clearSingleFile = (field: UploadField) => {
    setUploads((prev) => ({ ...prev, [field]: null }));
    setUploadPreviews((prev) => {
      const next = { ...prev };
      const current = next[field];
      if (current) {
        URL.revokeObjectURL(current);
      }
      next[field] = null;
      return next;
    });
    setGeminiResult(null);
    setVideoUrl(null);
    setYoutubeLink("");
  };

  const handleFileSelect = (field: UploadField, file: File | null) => {
    setNotice(null);
    setGeminiError(null);
    setSeedanceError(null);

    if (!file) {
      clearSingleFile(field);
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setGeminiError(validationError);
      return;
    }

    const newPreview = URL.createObjectURL(file);
    setUploads((prev) => ({ ...prev, [field]: file }));
    setUploadPreviews((prev) => {
      const next = { ...prev };
      if (next[field]) {
        URL.revokeObjectURL(next[field]!);
      }
      next[field] = newPreview;
      return next;
    });
    setGeminiResult(null);
    setVideoUrl(null);
    setYoutubeLink("");
  };

  const resetAll = () => {
    Object.values(uploadPreviews).forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    setUploads(emptyUploads);
    setUploadPreviews(emptyPreviews);
    setGeminiPrompt(DEFAULT_GEMINI_PROMPT);
    setSeedancePrompt(DEFAULT_SEEDANCE_PROMPT);
    setGeminiResult(null);
    setVideoUrl(null);
    setYoutubeLink("");
    setGeminiError(null);
    setSeedanceError(null);
    setNotice(null);
  };

  const handleGenerateImages = async () => {
    setGeminiError(null);
    setSeedanceError(null);
    setNotice(null);

    if (!allImagesSelected) {
      setGeminiError("Для генерації потрібно завантажити всі 4 фото.");
      return;
    }

    if (!geminiPrompt.trim()) {
      setGeminiError("Промпт для Gemini не може бути порожнім.");
      return;
    }

    const formData = new FormData();
    formData.append("modelFront", uploads.modelFront as File);
    formData.append("modelBack", uploads.modelBack as File);
    formData.append("clothFront", uploads.clothFront as File);
    formData.append("clothBack", uploads.clothBack as File);
    formData.append("prompt", geminiPrompt.trim());

    setIsGeminiLoading(true);
    try {
      const response = await fetch("/api/gemini-tryon", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | { frontResult?: string; backResult?: string; error?: string }
        | undefined;

      if (!response.ok || !payload?.frontResult || !payload?.backResult) {
        throw new Error(payload?.error ?? "Не вдалося згенерувати фото через Gemini.");
      }

      setGeminiResult({
        frontResult: payload.frontResult,
        backResult: payload.backResult,
      });
      setVideoUrl(null);
      setYoutubeLink("");
      setNotice("Фото згенеровано. Можна переходити до етапу 2.");
      step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setGeminiError(error instanceof Error ? error.message : "Помилка генерації фото.");
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    setSeedanceError(null);
    setNotice(null);

    if (!geminiResult) {
      setSeedanceError("Спочатку завершіть етап 1 та отримайте два фото від Gemini.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImage: geminiResult.frontResult,
          backImage: geminiResult.backResult,
          prompt: seedancePrompt.trim(),
        }),
      });
      const payload = (await response.json()) as
        | { videoUrl?: string; error?: string }
        | undefined;

      if (!response.ok || !payload?.videoUrl) {
        throw new Error(payload?.error ?? "Не вдалося згенерувати відео.");
      }

      setVideoUrl(payload.videoUrl);
      setNotice("Відео готове. Додайте YouTube посилання та скопіюйте фінальний результат.");
    } catch (error) {
      setSeedanceError(error instanceof Error ? error.message : "Помилка генерації відео.");
    } finally {
      setIsSeedanceLoading(false);
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(successMessage);
    } catch {
      setSeedanceError("Не вдалося скопіювати текст у буфер обміну.");
    }
  };

  const copyFinalResult = async () => {
    if (!videoUrl) {
      setSeedanceError("Спочатку згенеруйте відео.");
      return;
    }

    const resultText = [
      "FIT VIDEO GENERATOR — Фінальний результат",
      `Відео: ${videoUrl}`,
      `YouTube: ${youtubeLink.trim() || "ще не додано"}`,
    ].join("\n");

    await copyToClipboard(resultText, "Фінальний результат скопійовано.");
  };

  const copyYoutubeForRuslana = async () => {
    if (!youtubeLink.trim()) {
      setSeedanceError("Додайте посилання на YouTube перед копіюванням.");
      return;
    }

    await copyToClipboard(youtubeLink.trim(), "Посилання для Руслани скопійовано.");
  };

  return (
    <main className="min-h-screen bg-grid px-4 py-8 text-zinc-100 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-border bg-surface p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-red-300">
                Military / Tactical / Production Tool
              </p>
              <h1 className="text-3xl font-bold tracking-wide text-white md:text-4xl">
                FIT VIDEO GENERATOR
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-300 md:text-base">
                Перевдягання фото через Gemini та генерація відео через Seedance 2.0.
              </p>
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-200 hover:border-danger hover:text-red-200"
            >
              Очистити все і почати заново
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            {progressItems.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider",
                  item.done
                    ? "border-emerald-700/70 bg-emerald-900/20 text-emerald-300"
                    : "border-border bg-surface-muted text-zinc-400",
                )}
              >
                {index + 1}. {item.label}
              </div>
            ))}
          </div>
        </header>

        {notice ? (
          <div className="rounded-lg border border-emerald-700/70 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        ) : null}

        <StepCard
          step={1}
          title="Перевдягання фото через Gemini"
          subtitle="Завантажте 4 фото, перевірте промпт і згенеруйте front/back результат."
          status={geminiResult ? "done" : "active"}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {uploadConfig.map((item) => (
              <FileUpload
                key={item.key}
                id={item.key}
                title={item.title}
                subtitle={item.subtitle}
                fileName={uploads[item.key]?.name}
                previewUrl={uploadPreviews[item.key] ?? undefined}
                onSelect={(file) => handleFileSelect(item.key, file)}
                onClear={() => clearSingleFile(item.key)}
                disabled={isGeminiLoading}
              />
            ))}
          </div>

          <div className="mt-4">
            <PromptBox
              label="Промпт для Gemini"
              value={geminiPrompt}
              onChange={setGeminiPrompt}
              rows={7}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateImages}
              disabled={isGeminiLoading}
              className="rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {geminiResult ? "Згенерувати фото знову" : "Згенерувати фото"}
            </button>

            {isGeminiLoading ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-red-900 bg-danger-soft px-3 py-2 text-sm text-red-100">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-100 border-t-transparent" />
                Gemini генерує фото...
              </div>
            ) : null}
          </div>

          {geminiError ? (
            <p className="mt-3 rounded-lg border border-red-800 bg-danger-soft px-3 py-2 text-sm text-red-200">
              {geminiError}
            </p>
          ) : null}

          {geminiResult ? (
            <div className="mt-5 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <ImagePreview
                  title="Результат Gemini — спереду"
                  imageUrl={geminiResult.frontResult}
                  downloadName="gemini-front-result.png"
                />
                <ImagePreview
                  title="Результат Gemini — ззаду"
                  imageUrl={geminiResult.backResult}
                  downloadName="gemini-back-result.png"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-zinc-200 hover:border-danger hover:text-red-200"
              >
                Перейти до етапу 2
              </button>
            </div>
          ) : null}
        </StepCard>

        <div ref={step2Ref}>
          <StepCard
            step={2}
            title="Генерація відео через Seedance 2.0"
            subtitle="Використовує front/back фото з етапу 1 і створює фінальне fit відео."
            status={videoUrl ? "done" : geminiResult ? "active" : "idle"}
          >
            {geminiResult ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <ImagePreview
                    title="Gemini front (вхід у Seedance)"
                    imageUrl={geminiResult.frontResult}
                    downloadName="seedance-input-front.png"
                  />
                  <ImagePreview
                    title="Gemini back (вхід у Seedance)"
                    imageUrl={geminiResult.backResult}
                    downloadName="seedance-input-back.png"
                  />
                </div>

                <div className="mt-4">
                  <PromptBox
                    label="Промпт для Seedance 2.0"
                    value={seedancePrompt}
                    onChange={setSeedancePrompt}
                    rows={6}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleGenerateVideo}
                    disabled={isSeedanceLoading}
                    className="rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {videoUrl ? "Згенерувати відео знову" : "Згенерувати відео"}
                  </button>

                  {isSeedanceLoading ? (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-red-900 bg-danger-soft px-3 py-2 text-sm text-red-100">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-100 border-t-transparent" />
                      Seedance генерує відео...
                    </div>
                  ) : null}
                </div>

                {seedanceError ? (
                  <p className="mt-3 rounded-lg border border-red-800 bg-danger-soft px-3 py-2 text-sm text-red-200">
                    {seedanceError}
                  </p>
                ) : null}

                {videoUrl ? (
                  <div className="mt-5 space-y-4">
                    <VideoPreview videoUrl={videoUrl} />

                    <div className="rounded-xl border border-border bg-surface-muted p-3">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-200">
                          Посилання на YouTube
                        </span>
                        <input
                          type="url"
                          value={youtubeLink}
                          onChange={(event) => setYoutubeLink(event.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-danger"
                        />
                      </label>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={copyFinalResult}
                          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-danger hover:text-red-200"
                        >
                          Скопіювати фінальний результат
                        </button>
                        <button
                          type="button"
                          onClick={copyYoutubeForRuslana}
                          className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Скопіювати посилання для Руслани
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-zinc-300">
                Спочатку згенеруйте результати Gemini на етапі 1.
              </div>
            )}
          </StepCard>
        </div>
      </div>
    </main>
  );
}
