"use client";

import { useState } from "react";
import { Activity, Zap, ShieldAlert, Clock, Target, Loader2, Sparkles } from "lucide-react";
import SelectField from "./SelectField";
import {
  PHYSICAL_STATUS_OPTIONS,
  ENERGY_STATUS_OPTIONS,
  INJURY_OPTIONS,
  INJURY_PLACE_OPTIONS,
  INJURY_SEVERITY_OPTIONS,
  AVAILABLE_TIME_OPTIONS,
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
  available_time: "",
  train_goal: "",
};

interface TrainFormProps {
  onSubmit: (values: TrainFormValues) => void;
  submitting: boolean;
}

export default function TrainForm({ onSubmit, submitting }: TrainFormProps) {
  const [values, setValues] = useState<TrainFormValues>(EMPTY_FORM);

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
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <SelectField
        label="身体状态"
        value={values.physical_status}
        onChange={(v) => update("physical_status", v as TrainFormValues["physical_status"])}
        options={PHYSICAL_STATUS_OPTIONS}
        icon={Activity}
        required
      />
      <SelectField
        label="精力状态"
        value={values.energy_status}
        onChange={(v) => update("energy_status", v as TrainFormValues["energy_status"])}
        options={ENERGY_STATUS_OPTIONS}
        icon={Zap}
        required
      />
      <SelectField
        label="是否有伤病"
        value={values.do_you_have_injury}
        onChange={handleInjuryChange}
        options={INJURY_OPTIONS}
        icon={ShieldAlert}
        required
      />
      {hasInjury && (
        <div className="flex flex-col gap-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <SelectField
            label="受伤部位"
            value={values.the_place_of_injury}
            onChange={(v) => update("the_place_of_injury", v)}
            options={INJURY_PLACE_OPTIONS}
            required
          />
          <SelectField
            label="受伤严重程度"
            value={values.the_severity_of_injury}
            onChange={(v) => update("the_severity_of_injury", v)}
            options={INJURY_SEVERITY_OPTIONS}
            required
          />
        </div>
      )}
      <SelectField
        label="可用训练时间"
        value={values.available_time}
        onChange={(v) => update("available_time", v as TrainFormValues["available_time"])}
        options={AVAILABLE_TIME_OPTIONS}
        icon={Clock}
        required
      />
      <SelectField
        label="训练目标"
        value={values.train_goal}
        onChange={(v) => update("train_goal", v)}
        options={TRAIN_GOAL_OPTIONS}
        icon={Target}
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3.5 text-sm font-semibold text-[var(--color-on-primary)] shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            AI 正在生成方案…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            生成训练计划
          </>
        )}
      </button>
    </form>
  );
}
