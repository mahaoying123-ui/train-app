"use client";

import { useState } from "react";
import { ChevronDown, History, Trash2 } from "lucide-react";
import { HistoryItem } from "@/lib/types";
import { findLabel, TRAIN_GOAL_OPTIONS, AVAILABLE_TIME_OPTIONS } from "@/lib/formOptions";
import ResultCard from "./ResultCard";

interface HistoryListProps {
  history: HistoryItem[];
  onClear: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { hour12: false });
}

function goalLabel(value: string) {
  const label = findLabel(TRAIN_GOAL_OPTIONS, value);
  return label.split("：")[0] || label;
}

export default function HistoryList({ history, onClear }: HistoryListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <History className="h-4 w-4" aria-hidden="true" />
        还没有历史提交记录。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-muted-foreground)]">
          共 {history.length} 条记录（仅保存在本浏览器）
        </span>
        <button
          onClick={onClear}
          className="flex cursor-pointer items-center gap-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          清空历史
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {history.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
            >
              <button
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {goalLabel(item.input.train_goal)} ·{" "}
                    {findLabel(AVAILABLE_TIME_OPTIONS, item.input.available_time)}
                  </span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                  <ResultCard outputs={item.outputs} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
