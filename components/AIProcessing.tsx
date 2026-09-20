"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const DEFAULT_PHASES = ["分析身体状态", "评估训练负荷", "匹配训练方案", "生成今日计划"];

interface AIProcessingProps {
  phases?: string[];
}

export default function AIProcessing({ phases = DEFAULT_PHASES }: AIProcessingProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => Math.min(i + 1, phases.length - 1));
    }, 1400);
    return () => clearInterval(id);
  }, [phases.length]);

  return (
    <div className="flex flex-col items-center gap-7 py-12">
      <span
        className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]"
        aria-hidden="true"
      />
      <ul className="flex flex-col gap-3.5">
        {phases.map((phase, i) => {
          const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          return (
            <li key={phase} className="flex items-center gap-2.5 text-sm">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors duration-200 ease-out ${
                  state === "done"
                    ? "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
                    : state === "active"
                      ? "border-[var(--color-foreground)] text-[var(--color-foreground)]"
                      : "border-[var(--color-border)]"
                }`}
              >
                {state === "done" ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden="true" />
                ) : state === "active" ? (
                  "●"
                ) : (
                  ""
                )}
              </span>
              <span
                className={
                  state === "pending" ? "text-[var(--color-tertiary)]" : "text-[var(--color-foreground)]"
                }
              >
                {phase}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
