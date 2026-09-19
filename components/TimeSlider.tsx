"use client";

import { useId } from "react";
import { Clock } from "lucide-react";

const STEPS = ["5min", "15min", "30min", "60min"];
const MINUTES: Record<string, string> = { "5min": "5", "15min": "15", "30min": "30", "60min": "60" };

interface TimeSliderProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function TimeSlider({ label, value, onChange }: TimeSliderProps) {
  const id = useId();
  const index = Math.max(STEPS.indexOf(value), 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted-foreground)]">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </label>
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          今天可训练 {MINUTES[STEPS[index]]} 分钟
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={STEPS.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(STEPS[Number(e.target.value)])}
        className="w-full cursor-pointer"
        aria-valuetext={`${MINUTES[STEPS[index]]} 分钟`}
      />
      <div className="flex justify-between text-[11px] text-[var(--color-muted-foreground)]">
        {STEPS.map((s) => (
          <span key={s}>{MINUTES[s]} min</span>
        ))}
      </div>
    </div>
  );
}
