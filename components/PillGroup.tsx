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
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted-foreground)]">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
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
              className={`cursor-pointer rounded-xl border text-sm font-medium transition-all duration-150 ${
                compact ? "px-3 py-1.5 text-[13px]" : "px-3.5 py-2"
              } ${
                selected
                  ? "border-[var(--color-foreground)] bg-[var(--color-foreground)] text-[var(--color-on-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:border-[var(--color-foreground)]/40"
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
