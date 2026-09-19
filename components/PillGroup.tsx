import type { LucideIcon } from "lucide-react";
import { Option } from "@/lib/formOptions";

interface PillGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  icon?: LucideIcon;
  compact?: boolean;
}

export default function PillGroup({
  label,
  value,
  onChange,
  options,
  icon: Icon,
  compact = false,
}: PillGroupProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-secondary)]">
        {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />}
        {label}
      </span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`cursor-pointer rounded-full border text-sm transition-all duration-200 ease-out ${
                compact ? "px-3 py-1.5 text-[13px]" : "px-4 py-2"
              } ${
                selected
                  ? "border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent-text)]"
                  : "border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:border-[var(--color-tertiary)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
