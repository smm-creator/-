"use client";

interface PromptBoxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
}

export default function PromptBox({
  label,
  value,
  onChange,
  disabled = false,
  rows = 5,
  placeholder = "Введіть промпт...",
}: PromptBoxProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        <span className="text-xs text-gray-400">{value.length} символів</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm leading-relaxed resize-none"
        style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", outline: "none", color: "#111", transition: "border-color 0.15s, box-shadow 0.15s" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,17,17,0.07)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}
