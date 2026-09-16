import { ArrowRight } from "lucide-react";

interface Option {
  id: string;
  title: string;
  text: string;
}

interface OptionPickerProps {
  options: Option[];
  onChoose: (id: string) => void;
  submitting: boolean;
}

const ACCENTS = [
  { badge: "bg-orange-100 text-orange-700", border: "border-orange-200" },
  { badge: "bg-rose-100 text-rose-700", border: "border-rose-200" },
  { badge: "bg-sky-100 text-sky-700", border: "border-sky-200" },
  { badge: "bg-violet-100 text-violet-700", border: "border-violet-200" },
];

function splitTag(text: string): { tag?: string; body: string } {
  const m = text.match(/^方案[A-D]（([^)）]+)[）)]\s*[：:]?\s*/);
  if (!m) return { body: text };
  return { tag: m[1], body: text.slice(m[0].length).trim() };
}

export default function OptionPicker({ options, onChoose, submitting }: OptionPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        AI 生成了 {options.length} 套候选方案，选一个继续：
      </p>
      {options.map((opt, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        const { tag, body } = splitTag(opt.text);
        return (
          <div
            key={opt.id}
            className={`flex flex-col gap-3 rounded-xl border ${accent.border} bg-[var(--color-card)] p-4 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${accent.badge}`}
              >
                {opt.id}
              </span>
              {tag && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${accent.badge}`}>
                  {tag}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
              {body}
            </p>
            <button
              onClick={() => onChoose(opt.id)}
              disabled={submitting}
              className="flex w-fit cursor-pointer items-center gap-1.5 self-start rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {opt.title}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
