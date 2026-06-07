"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StepCardProps = {
  step: number;
  title: string;
  subtitle?: string;
  status?: "idle" | "active" | "done";
  children: ReactNode;
};

export function StepCard({
  step,
  title,
  subtitle,
  status = "idle",
  children,
}: StepCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-surface p-5 md:p-6",
        status === "active" && "border-danger shadow-[0_0_0_1px_rgba(209,14,14,0.65)]",
        status === "done" && "border-success",
      )}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="mb-2 inline-flex items-center rounded bg-danger-soft px-2 py-1 text-xs font-semibold uppercase tracking-wider text-red-200">
            Етап {step}
          </div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
        </div>
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
            status === "active" && "bg-red-950/60 text-red-200",
            status === "done" && "bg-emerald-900/40 text-emerald-300",
            status === "idle" && "bg-zinc-800 text-zinc-300",
          )}
        >
          {status === "done" ? "Готово" : status === "active" ? "В роботі" : "Очікує"}
        </div>
      </header>
      {children}
    </section>
  );
}
