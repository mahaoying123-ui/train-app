import { ArrowRight } from "lucide-react";
import AIProcessing from "./AIProcessing";

const CHOOSE_PHASES = ["确认你的选择", "生成具体动作", "整理今日计划"];

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

function splitTag(text: string): { tag?: string; body: string } {
  const m = text.match(/^方案[A-D]（([^)）]+)[）)]\s*[：:]?\s*/);
  if (!m) return { body: text };
  return { tag: m[1], body: text.slice(m[0].length).trim() };
}

// 方案文本里通常写着"热身5min...主训20min...收身5min"，这里把出现过的
// 分钟数加总，作为唯一可信的、不是凭空编造的统计数字展示出来。
function totalMinutes(text: string): number | null {
  const matches = [...text.matchAll(/(\d+)\s*min/gi)];
  if (matches.length === 0) return null;
  return matches.reduce((sum, m) => sum + Number(m[1]), 0);
}

export default function OptionPicker({ options, onChoose, submitting }: OptionPickerProps) {
  if (submitting) {
    return <AIProcessing phases={CHOOSE_PHASES} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] text-[var(--color-secondary)]">
        AI 生成了 {options.length} 套候选方案，选一个继续
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map((opt) => {
          const { tag, body } = splitTag(opt.text);
          const minutes = totalMinutes(opt.text);
          return (
            <div
              key={opt.id}
              className="group flex flex-col gap-3 rounded-2xl border border-[var(--color-panel-border)] bg-[var(--color-panel-bg)] p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[var(--color-foreground)]">{opt.id}</span>
                {tag && (
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-accent-text)]">
                    {tag}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-secondary)]">
                {body}
              </p>
              <div className="mt-1 h-px bg-[var(--color-border)]" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-tertiary)]">
                  {minutes ? `共 ${minutes} 分钟` : ""}
                </span>
                <button
                  onClick={() => onChoose(opt.id)}
                  disabled={submitting}
                  className="flex cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-foreground)] transition-all duration-200 ease-out hover:gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  使用方案
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
