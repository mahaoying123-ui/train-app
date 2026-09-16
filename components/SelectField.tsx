import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { Option } from "@/lib/formOptions";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  icon?: LucideIcon;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "请选择",
  required = false,
  icon: Icon,
}: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-foreground)]">
        {Icon && <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />}
        {label}
        {required && <span className="text-[var(--color-destructive)]">*</span>}
      </span>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-3 text-sm text-[var(--color-card-foreground)] shadow-sm transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          aria-hidden="true"
        />
      </div>
    </label>
  );
}
