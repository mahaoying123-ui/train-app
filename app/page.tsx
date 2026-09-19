"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import StepIndicator from "@/components/StepIndicator";
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
    <div className="flex flex-1 flex-col bg-[var(--color-background)]">
      {/* 核心产品区：桌面端锁定为一屏高度，不需要滚动就能完成"记录状态 → AI决策 → 生成计划"。
          注意：这里不能加 flex-1——它会把 flex-basis 变成 0%，盖掉 lg:h-screen 的 100vh。 */}
      <div className="flex flex-col lg:h-screen lg:overflow-hidden">
        <Header />

        <main className="flex flex-1 flex-col items-center gap-5 px-6 py-6 lg:min-h-0 lg:justify-center lg:gap-6 lg:px-16 lg:py-6">
          <Hero />
          <StepIndicator current={currentStep} />

          <div className="flex w-full max-w-[720px] flex-col gap-4">
            <div
              className="w-full overflow-y-auto rounded-[20px] border p-8 backdrop-blur-sm lg:max-h-[calc(100vh-380px)]"
              style={{
                backgroundColor: "var(--color-panel-bg)",
                borderColor: "var(--color-panel-border)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              }}
            >
              {result ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-medium text-[var(--color-secondary)]">
                      今日训练计划
                    </h2>
                    <button
                      onClick={handleRestart}
                      className="cursor-pointer text-[13px] font-medium text-[var(--color-secondary)] transition-colors hover:text-[var(--color-foreground)]"
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
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-[var(--color-destructive-bg)] px-4 py-2.5 text-xs text-[var(--color-destructive)]">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {error}
              </div>
            )}
          </div>
        </main>

        <footer className="hidden shrink-0 py-3 text-center text-xs text-[var(--color-muted-foreground)] lg:block">
          Powered by AI
        </footer>
      </div>

      {/* 历史记录：不属于核心流程，放在第一屏之外，向下滚动才会看到 */}
      <section className="border-t border-[var(--color-border)] px-6 py-16 lg:px-16">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
          <h2 className="text-[15px] font-medium text-[var(--color-secondary)]">历史记录</h2>
          <HistoryList history={history} onClear={handleClearHistory} />
        </div>
      </section>
    </div>
  );
}
