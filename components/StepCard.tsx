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
    <div
      className={cn(
        "rounded tactical-border transition-all duration-300",
        isActive && "red-glow",
        isCompleted && "border-green-900/50"
      )}
      style={{ background: "#0d0d0d" }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-4 px-5 py-4 border-b",
          isActive ? "border-red-900/50" : isCompleted ? "border-green-900/30" : "border-gray-800"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 flex items-center justify-center font-black text-lg border-2 rounded shrink-0 transition-colors",
            isActive
              ? "border-red-500 text-red-500 bg-red-950/30"
              : isCompleted
              ? "border-green-500 text-green-500 bg-green-950/30"
              : "border-gray-700 text-gray-500"
          )}
        >
          {isCompleted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className={cn(
              "font-black text-base tracking-widest uppercase",
              isActive ? "text-white" : isCompleted ? "text-green-400" : "text-gray-500"
            )}
            style={{ letterSpacing: "0.12em" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 tracking-wider">{subtitle}</p>
          )}
        </div>
        {isActive && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-red" />
            <span className="text-xs text-red-400 font-mono tracking-wider">АКТИВНИЙ</span>
          </div>
        )}
        {isCompleted && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-green-500 font-mono tracking-wider">ВИКОНАНО</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">{children}</div>
    </div>
  );
}
