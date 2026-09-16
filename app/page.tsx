"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import Hero from "@/components/Hero";
import TrainForm from "@/components/TrainForm";
import OptionPicker from "@/components/OptionPicker";
import ResultCard from "@/components/ResultCard";
import HistoryList from "@/components/HistoryList";
import { TrainFormValues, HistoryItem } from "@/lib/types";
import { addHistoryItem, clearHistory, getHistory, getUserId } from "@/lib/history";

interface PlanOption {
  id: string;
  title: string;
  text: string;
}

interface PendingChoice {
  workflowRunId: string;
  formToken: string;
  options: PlanOption[];
  formValues: TrainFormValues;
}

const STEPS = ["填写信息", "选择方案", "查看计划"];

export default function Home() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const currentStep = result ? 2 : pendingChoice ? 1 : 0;

  function saveResult(formValues: TrainFormValues, outputs: Record<string, unknown>) {
    setResult(outputs);
    const updated = addHistoryItem({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      input: formValues,
      outputs,
    });
    setHistory(updated);
  }

  async function handleSubmit(values: TrainFormValues) {
    setSubmitting(true);
    setError(null);
    setResult(null);
    setPendingChoice(null);

    try {
      const res = await fetch("/api/train-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, userId: getUserId() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "请求失败，请稍后重试");
        return;
      }

      if (data.stage === "choose") {
        setPendingChoice({
          workflowRunId: data.workflowRunId,
          formToken: data.formToken,
          options: data.options,
          formValues: values,
        });
      } else {
        saveResult(values, data.outputs);
      }
    } catch {
      setError("网络异常，请检查网络后重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChoose(choiceId: string) {
    if (!pendingChoice) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/train-plan/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formToken: pendingChoice.formToken,
          workflowRunId: pendingChoice.workflowRunId,
          choice: choiceId,
          userId: getUserId(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "请求失败，请稍后重试");
        return;
      }

      saveResult(pendingChoice.formValues, data.outputs);
      setPendingChoice(null);
    } catch {
      setError("网络异常，请检查网络后重试");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  function handleRestart() {
    setResult(null);
    setPendingChoice(null);
    setError(null);
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-[var(--color-background)] px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <Hero />

        <ol className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                  i === currentStep
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : i < currentStep
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px]">
                  {i + 1}
                </span>
                {step}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-[var(--color-border)]" />}
            </li>
          ))}
        </ol>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          {result ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-foreground)]">
                  最终训练计划
                </h2>
                <button
                  onClick={handleRestart}
                  className="cursor-pointer text-xs font-medium text-[var(--color-primary)] hover:underline"
                >
                  重新生成
                </button>
              </div>
              <ResultCard outputs={result} />
            </div>
          ) : pendingChoice ? (
            <OptionPicker
              options={pendingChoice.options}
              onChoose={handleChoose}
              submitting={submitting}
            />
          ) : (
            <TrainForm onSubmit={handleSubmit} submitting={submitting} />
          )}
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm text-[var(--color-destructive)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-foreground)]">
            历史记录
          </h2>
          <HistoryList history={history} onClear={handleClearHistory} />
        </section>
      </div>
    </div>
  );
}
