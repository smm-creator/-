"use client";

import Image from "next/image";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB, cn } from "@/lib/utils";

type FileUploadProps = {
  id: string;
  title: string;
  subtitle: string;
  fileName?: string;
  previewUrl?: string;
  onSelect: (file: File | null) => void;
  onClear?: () => void;
  disabled?: boolean;
};

export function FileUpload({
  id,
  title,
  subtitle,
  fileName,
  previewUrl,
  onSelect,
  onClear,
  disabled = false,
}: FileUploadProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
        {fileName && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded border border-border px-2 py-1 text-xs text-zinc-300 hover:border-danger hover:text-red-200"
          >
            Очистити
          </button>
        ) : null}
      </div>

      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-600 px-3 py-5 text-center transition",
          !disabled && "hover:border-danger hover:bg-danger-soft/30",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          id={id}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onSelect(file);
          }}
        />
        <span className="text-sm font-medium text-zinc-200">
          {fileName ? "Змінити файл" : "Оберіть файл"}
        </span>
        <span className="text-xs text-zinc-500">
          JPG / PNG / WEBP, до {MAX_FILE_SIZE_MB}MB
        </span>
      </label>

      {fileName ? (
        <p className="mt-2 truncate text-xs text-zinc-300" title={fileName}>
          {fileName}
        </p>
      ) : null}

      {previewUrl ? (
        <div className="relative mt-3 h-36 overflow-hidden rounded-lg border border-border">
          <Image
            src={previewUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
      ) : null}
    </div>
  );
}
