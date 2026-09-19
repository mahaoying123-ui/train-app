import { Clock, Flame, Gauge, Dumbbell } from "lucide-react";
import { ParsedPlan } from "@/lib/parsePlan";

const STAT_ITEMS = (plan: ParsedPlan) =>
  [
    plan.totalTime && { icon: Clock, label: "总用时", value: plan.totalTime },
    plan.calories && { icon: Flame, label: "预计消耗", value: plan.calories },
    plan.intensity && { icon: Gauge, label: "强度", value: plan.intensity },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

export default function PlanView({ plan }: { plan: ParsedPlan }) {
  const stats = STAT_ITEMS(plan);

  return (
    <div className="flex flex-col gap-6">
      {(plan.name || stats.length > 0) && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
          {plan.name && (
            <h3 className="mb-3 text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
              {plan.name}
            </h3>
          )}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <stat.icon className="h-4 w-4 text-[var(--color-muted-foreground)]" aria-hidden="true" />
                  <span className="text-xs text-[var(--color-muted-foreground)]">{stat.label}</span>
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ol className="flex flex-col gap-5">
        {plan.stages.map((stage, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-on-primary)]">
                {i + 1}
              </span>
              {i < plan.stages.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-[var(--color-border)]" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 pb-1">
              <h4 className="text-base font-semibold text-[var(--color-foreground)]">
                {stage.title}
              </h4>
              {stage.note && (
                <p className="text-xs text-[var(--color-muted-foreground)]">{stage.note}</p>
              )}
              {stage.exercises.map((ex, j) => (
                <div
                  key={j}
                  className="flex flex-col gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-foreground)]">
                      <Dumbbell className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" aria-hidden="true" />
                      {ex.name}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-[var(--color-muted-foreground)]">
                      {ex.duration}
                      {ex.rest && ex.rest !== "0秒" && ex.rest !== "0min" ? ` · 间歇 ${ex.rest}` : ""}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                    {ex.content}
                  </p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
