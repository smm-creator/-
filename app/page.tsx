"use client";

import { useState, useCallback } from "react";
import FileUpload from "@/components/FileUpload";
import ImagePreview from "@/components/ImagePreview";
import PromptBox from "@/components/PromptBox";
import StepCard from "@/components/StepCard";
import VideoPreview from "@/components/VideoPreview";
import { compressImage, cn } from "@/lib/utils";

const DEFAULT_GEMINI_PROMPT =
  "This is a virtual clothing try-on task.\n\nIMAGE 1 = model photo. IMAGE 2 = clothing item to wear.\n\nTask: Redress the model from IMAGE 1 in the clothing from IMAGE 2.\n\nDo NOT change:\n- The model's face, hair, skin tone, body shape, pose, proportions\n- The background, lighting, shadows, camera angle\n\nDo CHANGE:\n- Remove ALL existing clothing from the model completely\n- Dress the model in the EXACT clothing shown in IMAGE 2\n- Reproduce the clothing's color, print, pattern, graphic, logo, text, and fabric texture with full accuracy — do not simplify or omit any detail\n- The clothing must sit naturally on the body with realistic fit, drape, and folds\n\nOutput: full body visible from head to toe, aspect ratio 4:5, no cropping.";

const DEFAULT_FRONT_PROMPT =
  "Fashion runway video. The model starts facing the camera and walks forward toward it with natural, fluid, confident steps. After a few steps the model slows down and smoothly turns around to face away from the camera. The video ends with the model standing still, facing away. Camera is fixed, no movement. Lighting, colors, and background stay exactly as in the input image — no darkening, no color shift. Full-body shot, centered, smooth motion throughout.";

const DEFAULT_BACK_PROMPT =
  "Fashion runway video. The model starts already facing away from the camera (back view). The model walks naturally and smoothly away from the camera with confident, fluid steps, then slows down and stops. Camera is fixed, no movement. Lighting, colors, and background stay exactly as in the input image — no darkening, no color shift. Full-body shot, centered, smooth motion throughout.";

const DURATION_OPTIONS = ["4","5","6","7","8","9","10","11","12","13","14","15"] as const;
type DurationValue = typeof DURATION_OPTIONS[number];

interface PhotoState {
  file: File | null;
  previewUrl: string | null;
}

interface GeminiResult {
  frontBase64: string;
  backBase64: string;
  frontMimeType: string;
  backMimeType: string;
  frontUrl: string;
  backUrl: string;
}

const emptyPhoto = (): PhotoState => ({ file: null, previewUrl: null });

export default function Home() {
  const [modelFront, setModelFront] = useState<PhotoState>(emptyPhoto());
  const [modelBack, setModelBack] = useState<PhotoState>(emptyPhoto());
  const [clothFront, setClothFront] = useState<PhotoState>(emptyPhoto());
  const [clothBack, setClothBack] = useState<PhotoState>(emptyPhoto());
  const [geminiPrompt, setGeminiPrompt] = useState(DEFAULT_GEMINI_PROMPT);

  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<GeminiResult | null>(null);

  const [frontVideoPrompt, setFrontVideoPrompt] = useState(DEFAULT_FRONT_PROMPT);
  const [backVideoPrompt, setBackVideoPrompt] = useState(DEFAULT_BACK_PROMPT);
  const [videoDuration, setVideoDuration] = useState<DurationValue>("8");
  const [seedanceLoading, setSeedanceLoading] = useState(false);
  const [seedanceError, setSeedanceError] = useState<string | null>(null);
  const [frontVideoUrl, setFrontVideoUrl] = useState<string | null>(null);
  const [backVideoUrl, setBackVideoUrl] = useState<string | null>(null);
  const [frontYoutubeLink, setFrontYoutubeLink] = useState("");
  const [backYoutubeLink, setBackYoutubeLink] = useState("");

  const allPhotosUploaded = !!modelFront.file && !!modelBack.file && !!clothFront.file && !!clothBack.file;

  const handlePhotoChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<PhotoState>>) =>
      (file: File, previewUrl: string) => setter({ file, previewUrl }),
    []
  );

  const handlePhotoClear = useCallback(
    (setter: React.Dispatch<React.SetStateAction<PhotoState>>) => () =>
      setter(emptyPhoto()),
    []
  );

  const handleReset = () => {
    setModelFront(emptyPhoto()); setModelBack(emptyPhoto());
    setClothFront(emptyPhoto()); setClothBack(emptyPhoto());
    setGeminiPrompt(DEFAULT_GEMINI_PROMPT);
    setGeminiResult(null); setGeminiError(null);
    setFrontVideoPrompt(DEFAULT_FRONT_PROMPT);
    setBackVideoPrompt(DEFAULT_BACK_PROMPT);
    setVideoDuration("8");
    setSeedanceError(null);
    setFrontVideoUrl(null); setBackVideoUrl(null);
    setFrontYoutubeLink(""); setBackYoutubeLink("");
  };

  const handleGenerateGemini = async () => {
    if (!allPhotosUploaded || !geminiPrompt.trim()) return;
    setGeminiLoading(true); setGeminiError(null); setGeminiResult(null);
    try {
      const [mfB64, mbB64, cfB64, cbB64] = await Promise.all([
        compressImage(modelFront.file!),
        compressImage(modelBack.file!),
        compressImage(clothFront.file!),
        compressImage(clothBack.file!),
      ]);
      const res = await fetch("/api/gemini-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelFrontBase64: mfB64, modelBackBase64: mbB64,
          clothFrontBase64: cfB64, clothBackBase64: cbB64,
          modelFrontMimeType: "image/jpeg",
          modelBackMimeType: "image/jpeg",
          clothFrontMimeType: "image/jpeg",
          clothBackMimeType: "image/jpeg",
          prompt: geminiPrompt.trim(),
        }),
      });
      const text = await res.text();
      let data: Record<string, string>;
      try { data = JSON.parse(text); } catch {
        throw new Error(res.status === 504 ? "Тайм-аут сервера. Спробуйте ще раз." : `Помилка сервера (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error ?? "Помилка сервера");
      setGeminiResult({
        frontBase64: data.frontResult,
        backBase64: data.backResult,
        frontMimeType: data.frontMimeType ?? "image/png",
        backMimeType: data.backMimeType ?? "image/png",
        frontUrl: data.frontUrl,
        backUrl: data.backUrl,
      });
    } catch (err) {
      setGeminiError(err instanceof Error ? err.message : "Невідома помилка");
    } finally {
      setGeminiLoading(false);
    }
  };

  const callSeedance = async (imageUrl: string, prompt: string): Promise<string> => {
    const res = await fetch("/api/seedance-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontImageUrl: imageUrl, backImageUrl: imageUrl, prompt, duration: videoDuration }),
    });
    const text = await res.text();
    let data: Record<string, string>;
    try { data = JSON.parse(text); } catch {
      throw new Error(
        res.status === 504
          ? "Тайм-аут сервера. Спробуйте меншу тривалість (8 сек)."
          : `Помилка сервера (${res.status}). Спробуйте ще раз.`
      );
    }
    if (!res.ok) throw new Error(data.error ?? "Помилка сервера");
    return data.videoUrl;
  };

  const handleGenerateSeedance = async () => {
    if (!geminiResult) return;
    setSeedanceLoading(true); setSeedanceError(null);
    setFrontVideoUrl(null); setBackVideoUrl(null);
    try {
      const [fUrl, bUrl] = await Promise.all([
        callSeedance(geminiResult.frontUrl, frontVideoPrompt.trim()),
        callSeedance(geminiResult.backUrl, backVideoPrompt.trim()),
      ]);
      setFrontVideoUrl(fUrl);
      setBackVideoUrl(bUrl);
    } catch (err) {
      setSeedanceError(err instanceof Error ? err.message : "Невідома помилка");
    } finally {
      setSeedanceLoading(false);
    }
  };

  const videosReady = !!(frontVideoUrl && backVideoUrl);
  const progressStep = videosReady ? 4 : geminiResult ? 3 : geminiLoading ? 2 : 1;

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">FIT VIDEO</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.96" />
            </svg>
            Скинути все
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Fit Video Generator
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm">
            Перевдягання фото через Gemini · Генерація відео через Seedance 2.0
          </p>

          {/* Progress steps */}
          <div className="flex items-center gap-0 mt-6">
            {[
              { num: 1, label: "Фото" },
              { num: 2, label: "Gemini" },
              { num: 3, label: "Seedance" },
              { num: 4, label: "YouTube" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    progressStep > s.num
                      ? "bg-green-500 text-white"
                      : progressStep === s.num
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-400"
                  )}>
                    {progressStep > s.num ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : s.num}
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    progressStep >= s.num ? "text-gray-700" : "text-gray-400"
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={cn(
                    "w-10 h-px mx-1 mb-4 transition-all",
                    progressStep > s.num ? "bg-green-400" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">

        {/* STEP 1 */}
        <StepCard
          stepNumber={1}
          title="Перевдягання фото"
          subtitle="Завантажте 4 фото — модель і одяг"
          isActive={!geminiResult}
          isCompleted={!!geminiResult}
        >
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Фото моделі</p>
              <div className="grid grid-cols-2 gap-4">
                <FileUpload
                  label="Спереду"
                  description="Вихідне фото людини"
                  value={modelFront.file}
                  previewUrl={modelFront.previewUrl}
                  onChange={handlePhotoChange(setModelFront)}
                  onClear={handlePhotoClear(setModelFront)}
                  disabled={geminiLoading}
                />
                <FileUpload
                  label="Ззаду"
                  description="Вихідне фото людини"
                  value={modelBack.file}
                  previewUrl={modelBack.previewUrl}
                  onChange={handlePhotoChange(setModelBack)}
                  onClear={handlePhotoClear(setModelBack)}
                  disabled={geminiLoading}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Фото одягу</p>
              <div className="grid grid-cols-2 gap-4">
                <FileUpload
                  label="Спереду"
                  description="Фото товару"
                  value={clothFront.file}
                  previewUrl={clothFront.previewUrl}
                  onChange={handlePhotoChange(setClothFront)}
                  onClear={handlePhotoClear(setClothFront)}
                  disabled={geminiLoading}
                />
                <FileUpload
                  label="Ззаду"
                  description="Фото товару"
                  value={clothBack.file}
                  previewUrl={clothBack.previewUrl}
                  onChange={handlePhotoChange(setClothBack)}
                  onClear={handlePhotoClear(setClothBack)}
                  disabled={geminiLoading}
                />
              </div>
            </div>

            {!allPhotosUploaded && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Завантажте всі 4 фотографії перед генерацією
              </div>
            )}

            <PromptBox
              label="Промпт для генерації"
              value={geminiPrompt}
              onChange={setGeminiPrompt}
              disabled={geminiLoading}
              rows={5}
            />

            {geminiError && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {geminiError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateGemini}
                disabled={!allPhotosUploaded || geminiLoading || !geminiPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-30"
              >
                {geminiLoading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity="0.2" />
                      <path d="M21 12a9 9 0 0 1-9 9" />
                    </svg>
                    Генеруємо фото...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Згенерувати фото
                  </>
                )}
              </button>
              {geminiResult && (
                <button
                  type="button"
                  onClick={() => { setGeminiResult(null); setFrontVideoUrl(null); setBackVideoUrl(null); setSeedanceError(null); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Повторити
                </button>
              )}
            </div>

            {geminiLoading && (
              <div className="flex flex-col items-center gap-3 py-8 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <p className="text-sm text-gray-500 font-medium">Gemini обробляє зображення...</p>
                <p className="text-xs text-gray-400 text-center max-w-xs">Зазвичай займає 30–90 секунд. Не закривайте сторінку.</p>
              </div>
            )}
          </div>
        </StepCard>

        {/* Gemini results */}
        {geminiResult && (
          <div className="rounded-2xl border border-green-200 bg-green-50/30 p-5 animate-fade-in">
            <p className="text-sm font-semibold text-green-700 mb-4 flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Результат — фото готові
            </p>
            <div className="grid grid-cols-2 gap-4">
              <ImagePreview label="Спереду" base64={geminiResult.frontBase64} mimeType={geminiResult.frontMimeType} filename="fit-front.png" />
              <ImagePreview label="Ззаду" base64={geminiResult.backBase64} mimeType={geminiResult.backMimeType} filename="fit-back.png" />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        <StepCard
          stepNumber={2}
          title="Генерація відео"
          subtitle="Seedance 2.0 — два окремих відео: спереду і ззаду"
          isActive={!!geminiResult && !videosReady}
          isCompleted={videosReady}
        >
          <div className="flex flex-col gap-6">

            {/* Input photos */}
            {geminiResult ? (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Вхідні фото з Gemini</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Спереду", b64: geminiResult.frontBase64, mime: geminiResult.frontMimeType },
                    { label: "Ззаду", b64: geminiResult.backBase64, mime: geminiResult.backMimeType },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`data:${item.mime};base64,${item.b64}`} alt={item.label} className="w-full h-28 object-contain bg-gray-50" />
                      <p className="text-xs text-gray-500 text-center py-1.5 border-t border-gray-100">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Фото з'являться тут після завершення Кроку 1
              </div>
            )}

            {/* Two prompts side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PromptBox
                label="Промпт — відео спереду"
                value={frontVideoPrompt}
                onChange={setFrontVideoPrompt}
                disabled={seedanceLoading}
                rows={7}
              />
              <PromptBox
                label="Промпт — відео ззаду"
                value={backVideoPrompt}
                onChange={setBackVideoPrompt}
                disabled={seedanceLoading}
                rows={7}
              />
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-800">Тривалість кожного відео</label>
              <select
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value as DurationValue)}
                disabled={seedanceLoading}
                className="w-40 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 cursor-pointer disabled:opacity-40"
                style={{ outline: "none" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,17,17,0.07)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {DURATION_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s} секунд</option>
                ))}
              </select>
            </div>

            {seedanceError && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {seedanceError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateSeedance}
                disabled={!geminiResult || seedanceLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-30"
              >
                {seedanceLoading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity="0.2" />
                      <path d="M21 12a9 9 0 0 1-9 9" />
                    </svg>
                    Генеруємо 2 відео...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Згенерувати 2 відео
                  </>
                )}
              </button>
              {videosReady && (
                <button
                  type="button"
                  onClick={() => { setFrontVideoUrl(null); setBackVideoUrl(null); setSeedanceError(null); setFrontYoutubeLink(""); setBackYoutubeLink(""); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Повторити
                </button>
              )}
            </div>

            {seedanceLoading && (
              <div className="flex flex-col items-center gap-3 py-10 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <p className="text-sm text-gray-500 font-medium">Seedance генерує 2 відео паралельно...</p>
                <p className="text-xs text-gray-400 text-center max-w-xs">Зазвичай займає 2–5 хвилин. Не закривайте сторінку.</p>
              </div>
            )}

            {/* Two video results */}
            {(frontVideoUrl || backVideoUrl) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {frontVideoUrl && (
                  <VideoPreview
                    videoUrl={frontVideoUrl}
                    label="Відео спереду"
                    youtubeLink={frontYoutubeLink}
                    onYoutubeLinkChange={setFrontYoutubeLink}
                  />
                )}
                {backVideoUrl && (
                  <VideoPreview
                    videoUrl={backVideoUrl}
                    label="Відео ззаду"
                    youtubeLink={backYoutubeLink}
                    onYoutubeLinkChange={setBackYoutubeLink}
                  />
                )}
              </div>
            )}
          </div>
        </StepCard>
      </main>

      <footer className="border-t border-gray-100 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">FIT VIDEO GENERATOR · Gemini + Seedance 2.0</span>
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", geminiLoading || seedanceLoading ? "bg-yellow-400 animate-pulse-dot" : "bg-green-400")} />
            <span className="text-xs text-gray-400">{geminiLoading || seedanceLoading ? "Обробка..." : "Готовий"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
