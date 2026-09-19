"use client";

import { useId } from "react";

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
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-[var(--color-secondary)]">
          {label}
        </label>
        <span className="text-lg font-semibold tracking-[-0.01em] text-[var(--color-foreground)]">
          {MINUTES[STEPS[index]]} 分钟
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
      <div className="flex justify-between text-[11px] text-[var(--color-tertiary)]">
        {STEPS.map((s) => (
          <span key={s}>{MINUTES[s]}</span>
        ))}
      </div>
    </div>
  );
}
