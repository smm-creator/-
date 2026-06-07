"use client";

import { triggerDownload } from "@/lib/utils";

type VideoPreviewProps = {
  videoUrl: string;
};

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 border-b border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">Готове відео</h3>
        <button
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-500"
          type="button"
          onClick={() => triggerDownload(videoUrl, "fit-video-generator-result.mp4")}
        >
          Завантажити відео
        </button>
      </div>
      <video className="aspect-video w-full bg-black" controls playsInline src={videoUrl}>
        Ваш браузер не підтримує відтворення відео.
      </video>
    </article>
  );
}
