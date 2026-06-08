"use client";

import { useState, useCallback } from "react";
import FileUpload from "@/components/FileUpload";
import ImagePreview from "@/components/ImagePreview";
import PromptBox from "@/components/PromptBox";
import StepCard from "@/components/StepCard";
import VideoPreview from "@/components/VideoPreview";
import { fileToBase64, cn } from "@/lib/utils";

const DEFAULT_GEMINI_PROMPT =
  "Використай фото моделі як основне референс-фото. Збережи обличчя, тіло, позу, пропорції, фон, світло, ракурс і загальний вигляд людини максимально незмінними. Використай фото одягу як референс для нового одягу. Перевдягни модель у цей одяг максимально реалістично. Заміни тільки одяг. Не змінюй обличчя, зачіску, фігуру, фон, колір шкіри, позу та ракурс. Одяг має виглядати природно на тілі, з реалістичними складками, тінями, посадкою і текстурою.";

const DEFAULT_SEEDANCE_PROMPT =
  "A person walks straight forward toward the camera in a straight line. The person does not turn or change direction. The camera moves smoothly, tracking the person, maintaining a constant frontal view. The subject takes several steps, then stops. The camera also stops. Cinematic, stable shot, no camera shake, smooth, centered composition, medium shot. The frame only shows the lower part of the body, the angle does not change. the lighting remains unchanged\nThen a person turns his back and walks back\nA person walks straight away from the camera. The person doesn't turn or change direction. The camera moves smoothly, tracking the person and maintaining a constant view from behind. The subject takes a few steps, then stops. The camera also stops. Cinematic, stable shot, no camera shake, smooth, centered composition, medium shot. The frame only shows the lower part of the body, the angle does not change. the lighting and background remains unchanged";

interface PhotoState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
}

interface GeminiResult {
  frontBase64: string;
  backBase64: string;
  frontMimeType: string;
  backMimeType: string;
}

const emptyPhoto = (): PhotoState => ({
  file: null,
  previewUrl: null,
  base64: null,
});

type Step = 1 | 2;

export default function Home() {
  const [modelFront, setModelFront] = useState<PhotoState>(emptyPhoto());
  const [modelBack, setModelBack] = useState<PhotoState>(emptyPhoto());
  const [clothFront, setClothFront] = useState<PhotoState>(emptyPhoto());
  const [clothBack, setClothBack] = useState<PhotoState>(emptyPhoto());
  const [geminiPrompt, setGeminiPrompt] = useState(DEFAULT_GEMINI_PROMPT);

  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<GeminiResult | null>(null);

  const [seedancePrompt, setSeedancePrompt] = useState(DEFAULT_SEEDANCE_PROMPT);
  const [seedanceLoading, setSeedanceLoading] = useState(false);
  const [seedanceError, setSeedanceError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [youtubeLink, setYoutubeLink] = useState("");

  const [activeStep, setActiveStep] = useState<Step>(1);

  const allPhotosUploaded =
    !!modelFront.file && !!modelBack.file && !!clothFront.file && !!clothBack.file;

  const handlePhotoChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<PhotoState>>) =>
      (file: File, previewUrl: string) => {
        setter({ file, previewUrl, base64: null });
      },
    []
  );

  const handlePhotoClear = useCallback(
    (setter: React.Dispatch<React.SetStateAction<PhotoState>>) => () => {
      setter(emptyPhoto());
    },
    []
  );

  const handleReset = () => {
    setModelFront(emptyPhoto());
    setModelBack(emptyPhoto());
    setClothFront(emptyPhoto());
    setClothBack(emptyPhoto());
    setGeminiPrompt(DEFAULT_GEMINI_PROMPT);
    setGeminiResult(null);
    setGeminiError(null);
    setSeedancePrompt(DEFAULT_SEEDANCE_PROMPT);
    setSeedanceError(null);
    setVideoUrl(null);
    setYoutubeLink("");
    setActiveStep(1);
  };

  const handleGenerateGemini = async () => {
    if (!allPhotosUploaded) return;
    if (!geminiPrompt.trim()) {
      setGeminiError("Промпт не може бути порожнім");
      return;
    }

    setGeminiLoading(true);
    setGeminiError(null);
    setGeminiResult(null);

    try {
      const [mfB64, mbB64, cfB64, cbB64] = await Promise.all([
        fileToBase64(modelFront.file!),
        fileToBase64(modelBack.file!),
        fileToBase64(clothFront.file!),
        fileToBase64(clothBack.file!),
      ]);

      const res = await fetch("/api/gemini-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelFrontBase64: mfB64,
          modelBackBase64: mbB64,
          clothFrontBase64: cfB64,
          clothBackBase64: cbB64,
          modelFrontMimeType: modelFront.file!.type,
          modelBackMimeType: modelBack.file!.type,
          clothFrontMimeType: clothFront.file!.type,
          clothBackMimeType: clothBack.file!.type,
          prompt: geminiPrompt.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Помилка сервера");

      setGeminiResult({
        frontBase64: data.frontResult,
        backBase64: data.backResult,
        frontMimeType: data.frontMimeType ?? "image/png",
        backMimeType: data.backMimeType ?? "image/png",
      });
      setActiveStep(2);
    } catch (err) {
      setGeminiError(
        err instanceof Error ? err.message : "Невідома помилка"
      );
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleGenerateSeedance = async () => {
    if (!geminiResult) return;
    if (!seedancePrompt.trim()) {
      setSeedanceError("Промпт відео не може бути порожнім");
      return;
    }

    setSeedanceLoading(true);
    setSeedanceError(null);
    setVideoUrl(null);

    try {
      const res = await fetch("/api/seedance-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImageBase64: geminiResult.frontBase64,
          backImageBase64: geminiResult.backBase64,
          frontMimeType: geminiResult.frontMimeType,
          backMimeType: geminiResult.backMimeType,
          prompt: seedancePrompt.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Помилка сервера");

      setVideoUrl(data.videoUrl);
    } catch (err) {
      setSeedanceError(
        err instanceof Error ? err.message : "Невідома помилка"
      );
    } finally {
      setSeedanceLoading(false);
    }
  };

  const progressStep = videoUrl ? 4 : geminiResult ? 3 : activeStep;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Top bar */}
      <div
        className="border-b"
        style={{ borderColor: "#1a1a1a", background: "#080808" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-8"
              style={{ background: "#dc2626" }}
            />
            <div>
              <span className="text-xs font-black tracking-widest text-gray-500 uppercase block">
                TACTICAL STUDIO
              </span>
              <span className="text-xs text-gray-600 font-mono">v2.0</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold tracking-wider border border-gray-800 text-gray-500 hover:border-red-700 hover:text-red-400 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.96" />
            </svg>
            СКИНУТИ ВСЕ
          </button>
        </div>
      </div>

      {/* Header */}
      <div
        className="border-b"
        style={{ borderColor: "#1a1a1a", background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div
                className="px-2 py-0.5 text-xs font-black tracking-widest"
                style={{ background: "#dc2626", color: "#fff" }}
              >
                FIT
              </div>
              <h1
                className="text-3xl font-black tracking-widest text-white uppercase"
                style={{ letterSpacing: "0.18em" }}
              >
                VIDEO GENERATOR
              </h1>
            </div>
            <p className="text-sm text-gray-500 tracking-wider font-mono">
              Перевдягання фото через Gemini · Генерація відео через Seedance 2.0
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-6 flex items-center gap-0">
            {[
              { num: 1, label: "ФОТО" },
              { num: 2, label: "GEMINI" },
              { num: 3, label: "SEEDANCE" },
              { num: 4, label: "YOUTUBE" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-8 h-8 flex items-center justify-center text-xs font-black border-2 transition-all",
                      progressStep >= s.num
                        ? "border-red-500 text-red-400 bg-red-950/30"
                        : "border-gray-800 text-gray-600"
                    )}
                  >
                    {progressStep > s.num ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold tracking-wider",
                      progressStep >= s.num ? "text-red-400" : "text-gray-600"
                    )}
                    style={{ fontSize: "9px", letterSpacing: "0.12em" }}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className="w-10 h-px mx-1 mb-4 transition-all"
                    style={{
                      background: progressStep > s.num ? "#dc2626" : "#2a2a2a",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* STEP 1 */}
        <StepCard
          stepNumber={1}
          title="Перевдягання фото"
          subtitle="Gemini AI · Завантажте 4 фото та згенеруйте результат"
          isActive={activeStep === 1 && !geminiResult}
          isCompleted={!!geminiResult}
        >
          <div className="flex flex-col gap-6">
            {/* Upload grid */}
            <div>
              <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-3" style={{ letterSpacing: "0.15em" }}>
                ▸ Фото моделі
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileUpload
                  label="Модель — Вигляд спереду"
                  description="Вихідне фото людини спереду"
                  value={modelFront.file}
                  previewUrl={modelFront.previewUrl}
                  onChange={handlePhotoChange(setModelFront)}
                  onClear={handlePhotoClear(setModelFront)}
                  disabled={geminiLoading}
                />
                <FileUpload
                  label="Модель — Вигляд ззаду"
                  description="Вихідне фото людини ззаду"
                  value={modelBack.file}
                  previewUrl={modelBack.previewUrl}
                  onChange={handlePhotoChange(setModelBack)}
                  onClear={handlePhotoClear(setModelBack)}
                  disabled={geminiLoading}
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-3" style={{ letterSpacing: "0.15em" }}>
                ▸ Фото одягу
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileUpload
                  label="Одяг — Вигляд спереду"
                  description="Фото товару спереду"
                  value={clothFront.file}
                  previewUrl={clothFront.previewUrl}
                  onChange={handlePhotoChange(setClothFront)}
                  onClear={handlePhotoClear(setClothFront)}
                  disabled={geminiLoading}
                />
                <FileUpload
                  label="Одяг — Вигляд ззаду"
                  description="Фото товару ззаду"
                  value={clothBack.file}
                  previewUrl={clothBack.previewUrl}
                  onChange={handlePhotoChange(setClothBack)}
                  onClear={handlePhotoClear(setClothBack)}
                  disabled={geminiLoading}
                />
              </div>
            </div>

            {/* Validation hint */}
            {!allPhotosUploaded && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded border text-xs font-mono"
                style={{ background: "#111", borderColor: "#2a2a2a", color: "#666" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Завантажте всі 4 фотографії перед генерацією
              </div>
            )}

            {/* Prompt */}
            <PromptBox
              label="Промпт для Gemini"
              value={geminiPrompt}
              onChange={setGeminiPrompt}
              disabled={geminiLoading}
              rows={6}
              placeholder="Опишіть завдання для Gemini..."
            />

            {/* Error */}
            {geminiError && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded border text-sm font-mono"
                style={{ background: "#1a0a0a", borderColor: "#dc2626", color: "#ef4444" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>{geminiError}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateGemini}
                disabled={!allPhotosUploaded || geminiLoading || !geminiPrompt.trim()}
                className="flex items-center gap-3 px-6 py-3 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-40"
                style={{
                  background: allPhotosUploaded && !geminiLoading && geminiPrompt.trim()
                    ? "#dc2626"
                    : "#333",
                  color: "#fff",
                  letterSpacing: "0.15em",
                }}
              >
                {geminiLoading ? (
                  <>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      className="animate-spin"
                    >
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity="0.3" />
                      <path d="M21 12a9 9 0 0 1-9 9" />
                    </svg>
                    ГЕНЕРУЄМО ФОТО...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    ЗГЕНЕРУВАТИ ФОТО
                  </>
                )}
              </button>

              {geminiResult && (
                <button
                  type="button"
                  onClick={() => { setGeminiResult(null); setActiveStep(1); setVideoUrl(null); setSeedanceError(null); }}
                  className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider border border-gray-700 text-gray-400 hover:border-red-600 hover:text-red-400 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-3.96" />
                  </svg>
                  ПОВТОРИТИ
                </button>
              )}
            </div>

            {/* Loading state */}
            {geminiLoading && (
              <div
                className="scan-overlay flex flex-col items-center justify-center gap-4 py-10 rounded border"
                style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-red-500"
                        style={{
                          animation: "pulse-red 1.2s ease-in-out infinite",
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-mono text-gray-400 tracking-wider">
                    Gemini обробляє зображення...
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-mono text-center max-w-sm">
                  Генерація може зайняти 30–90 секунд. Не закривайте сторінку.
                </p>
              </div>
            )}
          </div>
        </StepCard>

        {/* Gemini result preview */}
        {geminiResult && (
          <div
            className="tactical-border rounded p-5"
            style={{ background: "#0d0d0d" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4" style={{ background: "#22c55e" }} />
              <span className="text-xs font-black tracking-widest text-green-400 uppercase">
                Результат Gemini — Готово
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImagePreview
                label="Результат спереду"
                base64={geminiResult.frontBase64}
                mimeType={geminiResult.frontMimeType}
                filename="fit-front.png"
              />
              <ImagePreview
                label="Результат ззаду"
                base64={geminiResult.backBase64}
                mimeType={geminiResult.backMimeType}
                filename="fit-back.png"
              />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        <StepCard
          stepNumber={2}
          title="Генерація відео"
          subtitle="Seedance 2.0 via fal.ai · Отримайте fit video"
          isActive={!!geminiResult && !videoUrl}
          isCompleted={!!videoUrl}
        >
          {!geminiResult ? (
            <div className="flex items-center gap-3 py-6 justify-center text-gray-600 font-mono text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Спочатку виконайте Етап 1 — згенеруйте фото
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Preview thumbnails from Gemini */}
              <div>
                <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-3" style={{ letterSpacing: "0.15em" }}>
                  ▸ Вхідні фото (з Gemini)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Спереду", b64: geminiResult.frontBase64, mime: geminiResult.frontMimeType },
                    { label: "Ззаду", b64: geminiResult.backBase64, mime: geminiResult.backMimeType },
                  ].map((item) => (
                    <div key={item.label} className="tactical-border rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:${item.mime};base64,${item.b64}`}
                        alt={item.label}
                        className="w-full h-32 object-contain"
                        style={{ background: "#111" }}
                      />
                      <div className="px-2 py-1 text-xs text-gray-500 font-mono text-center border-t border-gray-800">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <PromptBox
                label="Промпт для Seedance 2.0"
                value={seedancePrompt}
                onChange={setSeedancePrompt}
                disabled={seedanceLoading}
                rows={5}
                placeholder="Опишіть рух та стиль відео..."
              />

              {/* Error */}
              {seedanceError && (
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded border text-sm font-mono"
                  style={{ background: "#1a0a0a", borderColor: "#dc2626", color: "#ef4444" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>{seedanceError}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateSeedance}
                  disabled={seedanceLoading || !seedancePrompt.trim()}
                  className="flex items-center gap-3 px-6 py-3 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{
                    background: !seedanceLoading && seedancePrompt.trim() ? "#dc2626" : "#333",
                    color: "#fff",
                    letterSpacing: "0.15em",
                  }}
                >
                  {seedanceLoading ? (
                    <>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5"
                        className="animate-spin"
                      >
                        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity="0.3" />
                        <path d="M21 12a9 9 0 0 1-9 9" />
                      </svg>
                      ГЕНЕРУЄМО ВІДЕО...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      ЗГЕНЕРУВАТИ ВІДЕО
                    </>
                  )}
                </button>

                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => { setVideoUrl(null); setSeedanceError(null); setYoutubeLink(""); }}
                    className="flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider border border-gray-700 text-gray-400 hover:border-red-600 hover:text-red-400 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-3.96" />
                    </svg>
                    ПОВТОРИТИ
                  </button>
                )}
              </div>

              {/* Loading state */}
              {seedanceLoading && (
                <div
                  className="scan-overlay flex flex-col items-center justify-center gap-4 py-10 rounded border"
                  style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-red-500"
                          style={{
                            animation: "pulse-red 1.2s ease-in-out infinite",
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-mono text-gray-400 tracking-wider">
                      Seedance генерує відео...
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-mono text-center max-w-sm">
                    Генерація відео може зайняти 2–5 хвилин. Не закривайте сторінку.
                  </p>
                </div>
              )}

              {/* Video result */}
              {videoUrl && (
                <VideoPreview
                  videoUrl={videoUrl}
                  youtubeLink={youtubeLink}
                  onYoutubeLinkChange={setYoutubeLink}
                />
              )}
            </div>
          )}
        </StepCard>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12" style={{ borderColor: "#1a1a1a", background: "#080808" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xs font-mono text-gray-700 tracking-wider">
            FIT VIDEO GENERATOR · Gemini + Seedance 2.0
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#dc2626" }}
            />
            <span className="text-xs font-mono text-gray-700">READY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
