"use client";

import { useState } from "react";
import { downloadFromUrl, copyToClipboard } from "@/lib/utils";

interface VideoPreviewProps {
  videoUrl: string;
  youtubeLink: string;
  onYoutubeLinkChange: (value: string) => void;
}

export default function VideoPreview({
  videoUrl,
  youtubeLink,
  onYoutubeLinkChange,
}: VideoPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!youtubeLink.trim()) return;
    const ok = await copyToClipboard(youtubeLink.trim());
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  const handleCopyVideoUrl = async () => {
    const ok = await copyToClipboard(videoUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="tactical-border rounded overflow-hidden flex flex-col gap-0"
      style={{ background: "#0a0a0a" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#dc2626">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-xs font-black tracking-widest text-gray-300 uppercase">
            Готове відео
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs text-green-500 font-mono">ГОТОВО</span>
        </div>
      </div>

      {/* Video player */}
      <div className="relative" style={{ background: "#000" }}>
        <video
          src={videoUrl}
          controls
          className="w-full"
          style={{ maxHeight: "480px", display: "block" }}
        >
          Ваш браузер не підтримує відтворення відео.
        </video>
      </div>

      {/* Actions */}
      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadFromUrl(videoUrl, "fit-video.mp4")}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black tracking-wider bg-red-700 hover:bg-red-600 text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            ЗАВАНТАЖИТИ ВІДЕО
          </button>

          <button
            type="button"
            onClick={handleCopyVideoUrl}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider border border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? "СКОПІЙОВАНО!" : "СКОПІЮВАТИ URL"}
          </button>
        </div>

        {/* YouTube link section */}
        <div className="border-t border-gray-800 pt-4 flex flex-col gap-3">
          <label className="text-xs font-bold tracking-widest text-gray-400 uppercase" style={{ letterSpacing: "0.15em" }}>
            Посилання на YouTube
          </label>
          <input
            type="url"
            value={youtubeLink}
            onChange={(e) => onYoutubeLinkChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 text-sm font-mono rounded"
            style={{
              background: "#0d0d0d",
              border: "1px solid #2a2a2a",
              color: "#e5e5e5",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(220, 38, 38, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#2a2a2a";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!youtubeLink.trim()}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-black tracking-widest border-2 transition-all disabled:opacity-30"
            style={{
              borderColor: youtubeLink.trim() ? "#dc2626" : "#333",
              color: youtubeLink.trim() ? "#ef4444" : "#555",
              background: youtubeLink.trim() ? "rgba(220,38,38,0.08)" : "transparent",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {linkCopied ? "ПОСИЛАННЯ СКОПІЙОВАНО! ✓" : "СКОПІЮВАТИ ПОСИЛАННЯ ДЛЯ РУСЛАНИ"}
          </button>
        </div>
      </div>
    </div>
  );
}
