import { ParsedPlan } from "@/lib/parsePlan";

const STAT_ITEMS = (plan: ParsedPlan) =>
  [
    plan.totalTime && { label: "总用时", value: plan.totalTime },
    plan.calories && { label: "预计消耗", value: plan.calories },
    plan.intensity && { label: "强度", value: plan.intensity },
  ].filter(Boolean) as { label: string; value: string }[];

export default function PlanView({ plan }: { plan: ParsedPlan }) {
  const stats = STAT_ITEMS(plan);

  return (
    <div className="flex flex-col gap-8">
      {(plan.name || stats.length > 0) && (
        <div className="flex flex-col gap-2">
          {plan.name && (
            <h3 className="text-xl font-semibold tracking-[-0.01em] text-[var(--color-foreground)]">
              {plan.name}
            </h3>
          )}
          {stats.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--color-secondary)]">
              {stats.map((stat, i) => (
                <span key={stat.label} className="flex items-baseline gap-1">
                  {i > 0 && <span className="text-[var(--color-border)]">·</span>}
                  <span className="font-medium text-[var(--color-foreground)]">{stat.value}</span>
                  <span className="text-xs text-[var(--color-tertiary)]">{stat.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {plan.stages.map((stage, i) => (
          <div key={i} className="flex gap-5">
            <div className="flex w-6 shrink-0 flex-col items-center">
              <span className="text-xs font-medium text-[var(--color-tertiary)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {i < plan.stages.length - 1 && (
                <span className="mt-2 w-px flex-1 bg-[var(--color-border)]" aria-hidden="true" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 pb-1">
              <div className="flex items-baseline gap-2">
                <h4 className="text-[15px] font-semibold text-[var(--color-foreground)]">
                  {stage.title}
                </h4>
              </div>
              {stage.note && (
                <p className="text-xs text-[var(--color-tertiary)]">{stage.note}</p>
              )}
              <div className="flex flex-col">
                {stage.exercises.map((ex, j) => (
                  <div
                    key={j}
                    className={`flex flex-col gap-0.5 py-3 ${
                      j > 0 ? "border-t border-[var(--color-border)]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {ex.name}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--color-tertiary)]">
                        {ex.duration}
                        {ex.rest && ex.rest !== "0秒" && ex.rest !== "0min" ? ` · 间歇 ${ex.rest}` : ""}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--color-secondary)]">
                      {ex.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
