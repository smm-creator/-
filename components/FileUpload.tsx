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
      if (validationError) {
        setError(validationError);
        return;
      }
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-xs font-bold tracking-widest text-gray-400 uppercase"
        style={{ letterSpacing: "0.15em" }}
      >
        {label}
      </label>

      {previewUrl ? (
        <div className="relative group tactical-border rounded overflow-hidden" style={{ background: "#0a0a0a" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-48 object-contain"
            style={{ background: "#111" }}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              className="px-3 py-1 text-xs font-bold tracking-wider border border-gray-500 text-gray-200 hover:border-red-500 hover:text-red-400 transition-colors"
            >
              ЗАМІНИТИ
            </button>
            <button
              type="button"
              onClick={() => { setError(null); onClear(); }}
              disabled={disabled}
              className="px-3 py-1 text-xs font-bold tracking-wider border border-gray-600 text-gray-400 hover:border-red-600 hover:text-red-500 transition-colors"
            >
              ВИДАЛИТИ
            </button>
          </div>
          {value && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1 flex items-center justify-between">
              <span className="text-xs text-gray-400 truncate">{value.name}</span>
              <span className="text-xs text-gray-500 ml-2 shrink-0">{formatFileSize(value.size)}</span>
            </div>
          )}
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative h-48 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all tactical-border rounded",
            isDragging
              ? "border-red-500 bg-red-950/20"
              : "hover:border-red-800",
            disabled && "opacity-40 cursor-not-allowed"
          )}
          style={{ background: "#0d0d0d" }}
        >
          <div className={cn(
            "w-10 h-10 flex items-center justify-center border-2 rounded transition-colors",
            isDragging ? "border-red-500 text-red-500" : "border-gray-600 text-gray-500"
          )}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-gray-400 tracking-wider">
              {isDragging ? "ВІДПУСТІТЬ ФАЙЛ" : "ПЕРЕТЯГНІТЬ АБО НАТИСНІТЬ"}
            </p>
            {description && (
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">JPG / PNG / WEBP · макс. 10 МБ</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
