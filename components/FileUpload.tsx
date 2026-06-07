"use client";

import { ChangeEvent, useId, useState } from "react";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_MB,
  cn,
  fileToDataUrl,
  formatBytes,
  validateImageFile
} from "@/lib/utils";

type FileUploadProps = {
  label: string;
  description: string;
  file: File | null;
  previewUrl: string | null;
  onChange: (file: File, previewUrl: string) => void;
  onClear: () => void;
};

export function FileUpload({
  label,
  description,
  file,
  previewUrl,
  onChange,
  onClear
}: FileUploadProps) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    const validation = validateImageFile(selectedFile);

    if (!validation.valid) {
      setError(validation.message ?? "Неможливо використати цей файл.");
      return;
    }

    setIsReading(true);
    setError(null);

    try {
      const dataUrl = await fileToDataUrl(selectedFile);
      onChange(selectedFile, dataUrl);
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Не вдалося прочитати файл.");
    } finally {
      setIsReading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/45 p-4 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100" htmlFor={inputId}>
            {label}
          </label>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
        {file ? (
          <button
            className="rounded-full border border-red-500/50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-200 transition hover:bg-red-500/15"
            type="button"
            onClick={() => {
              setError(null);
              onClear();
            }}
          >
            Очистити
          </button>
        ) : null}
      </div>

      <label
        className={cn(
          "group relative flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 text-center transition",
          previewUrl
            ? "border-red-500/50 bg-zinc-950"
            : "border-zinc-700 bg-zinc-950/70 hover:border-red-500/80 hover:bg-red-950/20"
        )}
        htmlFor={inputId}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Попередній перегляд: ${label}`}
            className="absolute inset-0 h-full w-full object-cover opacity-85 transition group-hover:scale-[1.02]"
            src={previewUrl}
          />
        ) : null}
        <div className="relative z-10 rounded-xl border border-zinc-700/80 bg-black/75 px-5 py-4 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-red-300">
            {isReading ? "Зчитування..." : file ? "Замінити фото" : "Завантажити фото"}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            JPG, PNG, WEBP до {MAX_IMAGE_SIZE_MB} МБ
          </p>
          {file ? (
            <p className="mt-2 text-xs text-zinc-300">
              {file.name} · {formatBytes(file.size)}
            </p>
          ) : null}
        </div>
        <input
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          className="sr-only"
          id={inputId}
          type="file"
          onChange={handleFile}
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
