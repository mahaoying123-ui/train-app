"use client";

import { useState } from "react";
import { Activity, Zap, ShieldAlert, Target, ArrowRight } from "lucide-react";
import PillGroup from "./PillGroup";
import TimeSlider from "./TimeSlider";
import AIProcessing from "./AIProcessing";
import {
  PHYSICAL_STATUS_OPTIONS,
  ENERGY_STATUS_OPTIONS,
  INJURY_OPTIONS,
  INJURY_PLACE_OPTIONS,
  INJURY_SEVERITY_OPTIONS,
  TRAIN_GOAL_OPTIONS,
  INJURY_YES,
} from "@/lib/formOptions";
import { TrainFormValues } from "@/lib/types";

const EMPTY_FORM: TrainFormValues = {
  physical_status: "",
  energy_status: "",
  do_you_have_injury: "",
  the_place_of_injury: "",
  the_severity_of_injury: "",
  // 滑块天然没有"未选择"的样子，给一个常见默认值比强迫用户先点一下更顺手。
  available_time: "30min",
  train_goal: "",
};

const SHORT_GOAL_OPTIONS = TRAIN_GOAL_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label.split("：")[0],
}));

interface TrainFormProps {
  onSubmit: (values: TrainFormValues) => void;
  submitting: boolean;
}

export default function TrainForm({ onSubmit, submitting }: TrainFormProps) {
  const [values, setValues] = useState<TrainFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const hasInjury = values.do_you_have_injury === INJURY_YES;

  function update<K extends keyof TrainFormValues>(key: K, value: TrainFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleInjuryChange(value: string) {
    setValues((prev) => ({
      ...prev,
      do_you_have_injury: value as TrainFormValues["do_you_have_injury"],
      the_place_of_injury: value === INJURY_YES ? prev.the_place_of_injury : "",
      the_severity_of_injury: value === INJURY_YES ? prev.the_severity_of_injury : "",
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const missing: string[] = [];
    if (!values.physical_status) missing.push("身体状态");
    if (!values.energy_status) missing.push("精力状态");
    if (!values.do_you_have_injury) missing.push("伤病情况");
    if (hasInjury && !values.the_place_of_injury) missing.push("受伤部位");
    if (hasInjury && !values.the_severity_of_injury) missing.push("受伤严重程度");
    if (!values.train_goal) missing.push("训练目标");

    if (missing.length > 0) {
      setFormError(`请先选择：${missing.join("、")}`);
      return;
    }

    setFormError(null);
    onSubmit(values);
  }

  if (submitting) {
    return <AIProcessing />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        <PillGroup
          label="身体状态"
          value={values.physical_status}
          onChange={(v) => update("physical_status", v as TrainFormValues["physical_status"])}
          options={PHYSICAL_STATUS_OPTIONS}
          icon={Activity}
        />
        <PillGroup
          label="精力状态"
          value={values.energy_status}
          onChange={(v) => update("energy_status", v as TrainFormValues["energy_status"])}
          options={ENERGY_STATUS_OPTIONS}
          icon={Zap}
        />
        <div className="flex flex-col gap-3">
          <PillGroup
            label="伤病情况"
            value={values.do_you_have_injury}
            onChange={handleInjuryChange}
            options={INJURY_OPTIONS}
            icon={ShieldAlert}
          />
          {hasInjury && (
            <div className="flex flex-col gap-3 border-l border-[var(--color-border)] pl-3">
              <PillGroup
                label="受伤部位"
                value={values.the_place_of_injury}
                onChange={(v) => update("the_place_of_injury", v)}
                options={INJURY_PLACE_OPTIONS}
                compact
              />
              <PillGroup
                label="受伤严重程度"
                value={values.the_severity_of_injury}
                onChange={(v) => update("the_severity_of_injury", v)}
                options={INJURY_SEVERITY_OPTIONS}
                compact
              />
            </div>
          )}
        </div>
        <TimeSlider
          label="可用训练时间"
          value={values.available_time}
          onChange={(v) => update("available_time", v as TrainFormValues["available_time"])}
        />
      </div>

      <div className="h-px bg-[var(--color-border)]" aria-hidden="true" />

      <PillGroup
        label="训练目标"
        value={values.train_goal}
        onChange={(v) => update("train_goal", v)}
        options={SHORT_GOAL_OPTIONS}
        icon={Target}
      />

      {formError && <p className="text-xs text-[var(--color-destructive)]">{formError}</p>}

      <button
        type="submit"
        className="flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 text-[15px] font-semibold text-[var(--color-on-primary)] transition-all duration-200 ease-out hover:-translate-y-px hover:opacity-90"
      >
        生成今日训练计划
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </form>
  );
}
