const STEPS = [
  { num: "01", label: "记录状态" },
  { num: "02", label: "AI 决策" },
  { num: "03", label: "你的计划" },
];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-3" aria-label="进度">
      {STEPS.map((step, i) => (
        <li key={step.num} className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 ${
              i === current
                ? "text-[var(--color-foreground)]"
                : i < current
                  ? "text-[var(--color-muted-foreground)]"
                  : "text-[var(--color-muted-foreground)]/50"
            }`}
          >
            <span className="text-[11px] tracking-wider">{step.num}</span>
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="h-px w-8 bg-[var(--color-border)]" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}
