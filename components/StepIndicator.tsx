const STEPS = [
  { num: "01", label: "记录状态" },
  { num: "02", label: "AI 决策" },
  { num: "03", label: "你的计划" },
];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-4" aria-label="进度">
      {STEPS.map((step, i) => (
        <li key={step.num} className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`text-[11px] tracking-wider transition-colors duration-200 ${
                i === current
                  ? "text-[var(--color-foreground)]"
                  : i < current
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-tertiary)]"
              }`}
            >
              {step.num}
            </span>
            <span
              className={`text-[13px] font-medium transition-colors duration-200 ${
                i === current
                  ? "text-[var(--color-foreground)]"
                  : i < current
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-tertiary)]"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span className="mb-4 h-px w-10 bg-[var(--color-border)]" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}
