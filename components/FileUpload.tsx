"use client";

import { useRef, useState, useCallback } from "react";
import { validateImageFile, fileToDataUrl, formatFileSize, cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  description?: string;
  value: File | null;
  previewUrl: string | null;
  onChange: (file: File, previewUrl: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function FileUpload({
  label,
  description,
  value,
  previewUrl,
  onChange,
  onClear,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateImageFile(file);
      if (validationError) { setError(validationError); return; }
      try {
        const url = await fileToDataUrl(file);
        onChange(file, url);
      } catch {
        setError("Помилка завантаження файлу");
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-800">{label}</label>
      {description && <p className="text-xs text-gray-400 -mt-1">{description}</p>}

      {previewUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={label} className="w-full h-44 object-contain bg-gray-50" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Замінити
            </button>
            <button
              type="button"
              onClick={() => { setError(null); onClear(); }}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Видалити
            </button>
          </div>
          {value && (
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-600 truncate">{value.name}</span>
              <span className="text-xs text-gray-400 ml-2 shrink-0">{formatFileSize(value.size)}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            "h-44 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            isDragging ? "border-gray-400 bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-gray-200" : "bg-gray-100"
          )}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Відпустіть файл" : "Перетягніть або натисніть"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · до 10 МБ</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} disabled={disabled} />
    </div>
  );
}
