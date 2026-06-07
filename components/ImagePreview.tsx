"use client";

import { downloadBase64Image } from "@/lib/utils";

interface ImagePreviewProps {
  label: string;
  base64: string;
  mimeType: string;
  filename?: string;
}

export default function ImagePreview({
  label,
  base64,
  mimeType,
  filename = "result.png",
}: ImagePreviewProps) {
  const src = `data:${mimeType};base64,${base64}`;

  return (
    <div
      className="tactical-border rounded overflow-hidden flex flex-col"
      style={{ background: "#0a0a0a" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
          {label}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs text-green-500 font-mono">ГОТОВО</span>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="w-full object-contain"
        style={{ maxHeight: "400px", background: "#111" }}
      />

      <div className="px-3 py-2 flex justify-end">
        <button
          type="button"
          onClick={() => downloadBase64Image(base64, mimeType, filename)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold tracking-wider border border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          ЗАВАНТАЖИТИ
        </button>
      </div>
    </div>
  );
}
