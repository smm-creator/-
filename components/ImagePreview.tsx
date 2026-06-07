"use client";

import Image from "next/image";

type ImagePreviewProps = {
  title: string;
  imageUrl: string;
  downloadName: string;
};

export function ImagePreview({ title, imageUrl, downloadName }: ImagePreviewProps) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted p-3">
      <h3 className="mb-2 text-sm font-semibold text-zinc-100">{title}</h3>
      <div className="relative mb-3 h-56 overflow-hidden rounded-lg border border-border">
        <Image
          src={imageUrl}
          alt={title}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border px-3 py-2 text-xs text-zinc-200 hover:border-danger hover:text-red-200"
        >
          Переглянути
        </a>
        <a
          href={imageUrl}
          download={downloadName}
          className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Завантажити
        </a>
      </div>
    </article>
  );
}
