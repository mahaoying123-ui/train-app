import { parsePlanText } from "@/lib/parsePlan";
import PlanView from "./PlanView";

function renderValue(value: unknown) {
  if (typeof value === "string") {
    const plan = parsePlanText(value);
    if (plan) return <PlanView plan={plan} />;
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
        {value}
      </p>
    );
  }
  return (
    <pre className="overflow-x-auto rounded-md bg-[var(--color-muted)] p-3 text-xs text-[var(--color-muted-foreground)]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

interface ResultCardProps {
  outputs: Record<string, unknown>;
}

export default function ResultCard({ outputs }: ResultCardProps) {
  const entries = Object.entries(outputs);

  if (entries.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">Dify 没有返回任何内容。</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col gap-1">
          {entries.length > 1 && (
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {key}
            </span>
          )}
          {renderValue(value)}
        </div>
      ))}
    </div>
  );
}
