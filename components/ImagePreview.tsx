"use client";

import { downloadFromUrl } from "@/lib/utils";

interface ImagePreviewProps {
  label: string;
  src: string;
  filename?: string;
}

export default function ImagePreview({ label, src, filename = "result.png" }: ImagePreviewProps) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Готово</span>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="w-full object-contain bg-gray-50" style={{ maxHeight: "380px" }} />

      <div className="px-4 py-2.5 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={() => downloadFromUrl(src, filename)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Завантажити
        </button>
      </div>
    </div>
  );
}
