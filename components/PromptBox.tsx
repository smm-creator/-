"use client";

type PromptBoxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

export function PromptBox({ label, value, onChange, rows = 5 }: PromptBoxProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-zinc-200">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-danger"
      />
    </label>
  );
}
