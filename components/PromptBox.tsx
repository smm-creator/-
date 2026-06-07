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
        <label className="text-xs font-bold tracking-widest text-gray-400 uppercase" style={{ letterSpacing: "0.15em" }}>
          {label}
        </label>
        <span className="text-xs text-gray-600 font-mono">{value.length} симв.</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded resize-none font-mono leading-relaxed"
        style={{
          background: "#0d0d0d",
          color: "#d1d5db",
          border: "1px solid #2a2a2a",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
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
    </div>
  );
}
