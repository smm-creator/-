"use client";

type PromptBoxProps = {
  label: string;
  description?: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
};

export function PromptBox({ label, description, value, rows = 7, onChange }: PromptBoxProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/45 p-4 shadow-xl shadow-black/20">
      <label className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-100" htmlFor={label}>
        {label}
      </label>
      {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      <textarea
        className="mt-4 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/25"
        id={label}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
