"use client";

type VideoPreviewProps = {
  videoUrl: string;
};

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  return (
    <article className="rounded-xl border border-border bg-surface-muted p-3">
      <h3 className="mb-2 text-sm font-semibold text-zinc-100">Згенероване відео</h3>
      <video
        src={videoUrl}
        controls
        className="mb-3 w-full rounded-lg border border-border bg-black"
      />
      <div className="flex flex-wrap gap-2">
        <a
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-border px-3 py-2 text-xs text-zinc-200 hover:border-danger hover:text-red-200"
        >
          Переглянути відео
        </a>
        <a
          href={videoUrl}
          download="fit-video.mp4"
          className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Завантажити відео
        </a>
      </div>
    </article>
  );
}
