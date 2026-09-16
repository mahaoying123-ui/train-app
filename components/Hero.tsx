import { ArrowDown, Dumbbell } from "lucide-react";

const NARRATIVE = [
  { num: "01", title: "记录状态", desc: "告诉我们你现在的感觉" },
  { num: "02", title: "AI 决策", desc: "多个 AI 视角正在评估你的状态" },
  { num: "03", title: "你的计划", desc: "为今天量身定制的训练决策" },
];

export default function Hero() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)]">
        <Dumbbell className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
        AI 训练计划生成器
      </h1>

      <div className="flex flex-col items-center pt-2">
        {NARRATIVE.map((step, i) => (
          <div key={step.num} className="flex flex-col items-center">
            <div className="flex flex-col items-center gap-1">
              <span className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-widest text-[var(--color-primary)]">
                {step.num}
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-foreground)]">
                {step.title}
              </span>
              <span className="max-w-xs text-sm text-[var(--color-muted-foreground)]">
                {step.desc}
              </span>
            </div>
            {i < NARRATIVE.length - 1 && (
              <ArrowDown
                className="my-2 h-4 w-4 text-[var(--color-border)]"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
