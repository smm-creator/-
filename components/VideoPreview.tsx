"use client";

import { useState } from "react";
import { downloadFromUrl, copyToClipboard } from "@/lib/utils";

interface VideoPreviewProps {
  videoUrl: string;
  youtubeLink: string;
  onYoutubeLinkChange: (value: string) => void;
}

export default function VideoPreview({ videoUrl, youtubeLink, onYoutubeLinkChange }: VideoPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!youtubeLink.trim()) return;
    const ok = await copyToClipboard(youtubeLink.trim());
    if (ok) { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500); }
  };

  const handleCopyVideoUrl = async () => {
    const ok = await copyToClipboard(videoUrl);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2500); }
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-800">Готове відео</span>
        </div>
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Готово</span>
      </div>

      <video src={videoUrl} controls className="w-full bg-black" style={{ maxHeight: "480px", display: "block" }}>
        Ваш браузер не підтримує відтворення відео.
      </video>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadFromUrl(videoUrl, "fit-video.mp4")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Завантажити відео
          </button>
          <button
            type="button"
            onClick={handleCopyVideoUrl}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? "Скопійовано ✓" : "Скопіювати URL"}
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-800">Посилання на YouTube</label>
          <p className="text-xs text-gray-400">Вставте сюди посилання після завантаження відео на YouTube</p>
          <input
            type="url"
            value={youtubeLink}
            onChange={(e) => onYoutubeLinkChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2.5 text-sm rounded-lg"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!youtubeLink.trim()}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-lg border-2 transition-all disabled:opacity-30"
            style={{
              borderColor: youtubeLink.trim() ? "#111" : "#e5e7eb",
              color: youtubeLink.trim() ? "#111" : "#9ca3af",
              background: "transparent",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {linkCopied ? "Скопійовано для Руслани ✓" : "Скопіювати посилання для Руслани"}
          </button>
        </div>
      </div>
    </div>
  );
}
