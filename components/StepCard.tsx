"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StepCardProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  children: ReactNode;
}

export default function StepCard({
  stepNumber,
  title,
  subtitle,
  isActive = false,
  isCompleted = false,
  children,
}: StepCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-200",
      isCompleted
        ? "border-green-200 bg-green-50/40"
        : isActive
        ? "border-gray-900 shadow-sm bg-white"
        : "border-gray-100 bg-gray-50/60"
    )}>
      <div className={cn(
        "flex items-center gap-4 px-6 py-4 border-b",
        isCompleted ? "border-green-100" : isActive ? "border-gray-100" : "border-gray-100"
      )}>
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all",
          isCompleted
            ? "bg-green-500 text-white"
            : isActive
            ? "bg-gray-900 text-white"
            : "bg-gray-200 text-gray-400"
        )}>
          {isCompleted ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className={cn(
            "font-bold text-base",
            isCompleted ? "text-green-700" : isActive ? "text-gray-900" : "text-gray-400"
          )}>
            {title}
          </h2>
          {subtitle && (
            <p className={cn("text-xs mt-0.5", isActive || isCompleted ? "text-gray-500" : "text-gray-400")}>
              {subtitle}
            </p>
          )}
        </div>

        {isActive && !isCompleted && (
          <span className="shrink-0 text-xs font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">
            Активний
          </span>
        )}
        {isCompleted && (
          <span className="shrink-0 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
            Готово ✓
          </span>
        )}
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}
