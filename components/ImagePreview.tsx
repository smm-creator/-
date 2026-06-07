"use client";

import { getFileExtensionFromDataUrl, triggerDownload } from "@/lib/utils";

type ImagePreviewProps = {
  title: string;
  imageUrl: string;
  filename: string;
};

export function ImagePreview({ title, imageUrl, filename }: ImagePreviewProps) {
  const extension = imageUrl.startsWith("data:") ? getFileExtensionFromDataUrl(imageUrl) : "jpg";
  const downloadName = filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100">{title}</h3>
        <button
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-500"
          type="button"
          onClick={() => triggerDownload(imageUrl, downloadName)}
        >
          Завантажити
        </button>
      </div>
      <a className="block" href={imageUrl} rel="noopener noreferrer" target="_blank">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={title} className="aspect-[4/5] w-full object-cover" src={imageUrl} />
      </a>
    </article>
  );
}
