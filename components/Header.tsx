import { Dumbbell } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-6 lg:px-16">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-foreground)] text-[var(--color-background)]">
          <Dumbbell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
          AI 训练计划生成器
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
        系统正常
      </div>
    </header>
  );
}
