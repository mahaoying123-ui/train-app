// 从 Dify Workflow 的 Python 代码节点（"CACULATION CODE"）完整移植而来。
// 该节点原本依赖 Supabase 里的用户画像（body_1）和训练历史（body），
// 但那两个数据源已经不存在了，所以这里的 profile/history 参数默认给出
// 和 Dify 节点在 Supabase 失效时完全相同的兜底值（空历史 + 默认画像）。
// 保留完整逻辑是为了将来如果接入真实的用户数据/历史记录，只需要把数据
// 传进 calculateWeights，不需要再碰 Dify 那边的工作流。

export interface UserProfile {
  age: number;
  heightCm: number;
  weightKg: number;
  fitLevel: "beginner" | "intermediate" | "advanced" | string;
}

export interface TrainingRecord {
  date: string; // "YYYY-MM-DD"
  trainingType?: string;
  durationMin?: number;
  intensity?: string;
  bodyParts?: string; // "|" 分隔
  caloriesBurned?: number;
  completed?: boolean;
}

export interface Weights {
  W1: number;
  W2: number;
  W3: number;
  W4: number;
  W5: number;
}

const DEFAULT_PROFILE: UserProfile = {
  age: 25,
  heightCm: 170,
  weightKg: 65,
  fitLevel: "beginner",
};

function statusToNum(s: string | undefined): number {
  const v = (s || "").toLowerCase().trim();
  return { low: 0.3, middle: 0.6, medium: 0.6, high: 1.0 }[v] ?? 0.6;
}

function intensityToNum(s: string | undefined): number {
  const v = (s || "").toLowerCase().trim();
  return (
    { none: 0, low: 1, medium: 2, moderate: 2, high: 3, severe: 3 }[v] ?? 0
  );
}

function daysSince(dateStr: string | undefined, today: Date): number {
  if (!dateStr) return 999;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return 999;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return 999;
  const diffMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - d.getTime();
  return Math.round(diffMs / 86400000);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function isTrainingDay(r: TrainingRecord): boolean {
  return r.trainingType !== "rest" && (r.durationMin ?? 0) > 0;
}

// ─────────────────────────── W1：强度匹配度 ───────────────────────────
function calcW1Raw(
  physicalStatus: string | undefined,
  energyStatus: string | undefined,
  fitLevel: string,
  history: TrainingRecord[],
  today: Date,
): number {
  const base = (statusToNum(physicalStatus) + statusToNum(energyStatus)) / 2;
  const fitCoef =
    { beginner: 0.7, intermediate: 0.85, advanced: 1.0 }[fitLevel.toLowerCase()] ?? 0.7;
  const adjusted = base * fitCoef;

  const trainDays = history.filter(isTrainingDay);
  const days = trainDays.length ? daysSince(trainDays[0].date, today) : 999;
  const dayAdj = days === 0 ? -0.2 : days === 1 ? 0.0 : (days - 1) * 0.05;

  const last3 = history.slice(0, 3);
  const intensityAdjs = last3.map((r) => {
    const iv = intensityToNum(r.intensity);
    return iv === 0 ? 0.0 : iv === 1 ? -0.1 : iv === 2 ? -0.2 : -0.3;
  });
  const intensityAdj = average(intensityAdjs);

  return clamp01(adjusted + dayAdj + intensityAdj);
}

// ─────────────────────────── W2：恢复优先级 ───────────────────────────
function calcW2Raw(
  injury: string | undefined,
  severity: string | undefined,
  age: number,
  history: TrainingRecord[],
  today: Date,
): number {
  const sortedTrain = history.filter(isTrainingDay);
  let consecutive = 0;
  for (let i = 0; i < sortedTrain.length; i++) {
    if (daysSince(sortedTrain[i].date, today) === i) consecutive++;
    else break;
  }
  const consMap: Record<number, number> = { 0: 0.1, 1: 0.1, 2: 0.3, 3: 0.6 };
  const consScore = consecutive <= 3 ? (consMap[consecutive] ?? 1.0) : 1.0;

  const last3 = history.slice(0, 3);
  const avgIntensity = last3.length
    ? average(last3.map((r) => intensityToNum(r.intensity)))
    : 0;
  const intensityScore = avgIntensity / 3.0;

  const ageCoef = age < 25 ? 0.8 : age <= 35 ? 1.0 : age <= 45 ? 1.2 : 1.5;

  const hasInjury = /\byes\b|有伤|injured/i.test(injury || "");
  let injuryScore = 0.0;
  if (hasInjury) {
    const sev = (severity || "").toLowerCase();
    if (sev.includes("severe") || sev.includes("high")) injuryScore = 1.0;
    else if (sev.includes("moderate") || sev.includes("medium")) injuryScore = 0.75;
    else injuryScore = 0.5;
  }

  const fatigueScore = (consScore * 0.5 + intensityScore * 0.5) * ageCoef;

  return clamp01(Math.max(injuryScore, fatigueScore));
}

// ─────────────────────────── W3：部位均衡性 ───────────────────────────
function calcW3Raw(history: TrainingRecord[], today: Date): number {
  const last7 = history.filter(
    (r) => daysSince(r.date, today) <= 7 && r.bodyParts !== "rest" && (r.durationMin ?? 0) > 0,
  );
  if (last7.length < 3) return 0.5;

  const freq: Record<string, number> = {};
  for (const r of last7) {
    for (const part of (r.bodyParts || "").split("|")) {
      const p = part.trim();
      if (p) freq[p] = (freq[p] ?? 0) + 1;
    }
  }
  const values = Object.values(freq);
  if (values.length === 0) return 0.5;

  const ratio = Math.max(...values) / last7.length;
  if (ratio > 0.6) return 1.0;
  if (ratio >= 0.4) return 0.6;
  if (ratio >= 0.2) return 0.3;
  return 0.1;
}

// ─────────────────────────── W4：目标导向 ───────────────────────────
function calcW4Raw(
  trainGoal: string | undefined,
  heightCmInput: number,
  weightKgInput: number,
  history: TrainingRecord[],
  today: Date,
): number {
  const goal = (trainGoal || "").toLowerCase();
  const heightCm = heightCmInput > 0 ? heightCmInput : 170;
  const weightKg = weightKgInput > 0 ? weightKgInput : 65;
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);

  let bmiScore: number;
  if (goal.includes("fat") || goal.includes("loss")) {
    bmiScore = bmi >= 25 ? 0.8 : bmi >= 22 ? 0.4 : 0.1;
  } else if (goal.includes("muscle") || goal.includes("gain")) {
    bmiScore = bmi < 18.5 ? 0.8 : bmi <= 22 ? 0.4 : 0.1;
  } else {
    bmiScore = bmi >= 18.5 && bmi < 25 ? 0.1 : 0.4;
  }

  const last14 = history.filter((r) => daysSince(r.date, today) <= 14);
  const older = last14.filter((r) => daysSince(r.date, today) > 7);
  const newer = last14.filter((r) => daysSince(r.date, today) <= 7);
  const avgCalories = (lst: TrainingRecord[]) =>
    lst.length ? average(lst.map((r) => r.caloriesBurned ?? 0)) : 0;
  const olderAvg = avgCalories(older);
  const newerAvg = avgCalories(newer);

  let trendScore: number;
  if (olderAvg > 0 && newerAvg > 0) {
    if (goal.includes("fat") || goal.includes("loss") || goal.includes("muscle") || goal.includes("gain")) {
      trendScore = newerAvg >= olderAvg ? 0.1 : 0.8;
    } else {
      const change = Math.abs(newerAvg - olderAvg) / olderAvg;
      trendScore = change < 0.1 ? 0.1 : change < 0.2 ? 0.4 : 0.7;
    }
  } else {
    trendScore = 0.3;
  }

  return clamp01(bmiScore * 0.4 + trendScore * 0.6);
}

// ─────────────────────────── W5：执行倾向 ───────────────────────────
function calcW5Raw(history: TrainingRecord[]): number {
  if (history.length < 3) return 0.5;
  const total = history.length;
  const completed = history.filter((r) => r.completed === true).length;
  const rate = completed / total;
  if (rate > 0.8) return 0.1;
  if (rate > 0.6) return 0.3;
  if (rate > 0.4) return 0.6;
  return 1.0;
}

export interface CalculateWeightsInput {
  physicalStatus: string;
  energyStatus: string;
  doYouHaveInjury: string;
  theSeverityOfInjury: string;
  trainGoal: string;
  profile?: Partial<UserProfile>;
  history?: TrainingRecord[];
  today?: Date;
}

export function calculateWeights(input: CalculateWeightsInput): Weights {
  const today = input.today ?? new Date();
  const profile = { ...DEFAULT_PROFILE, ...input.profile };
  const history = input.history ?? [];

  const raws = [
    calcW1Raw(input.physicalStatus, input.energyStatus, profile.fitLevel, history, today),
    calcW2Raw(input.doYouHaveInjury, input.theSeverityOfInjury, profile.age, history, today),
    calcW3Raw(history, today),
    calcW4Raw(input.trainGoal, profile.heightCm, profile.weightKg, history, today),
    calcW5Raw(history),
  ];

  const total = raws.reduce((a, b) => a + b, 0);
  const ws = total === 0 ? [0.2, 0.2, 0.2, 0.2, 0.2] : raws.map((r) => r / total);

  const round4 = (n: number) => Math.round(n * 10000) / 10000;
  return {
    W1: round4(ws[0]),
    W2: round4(ws[1]),
    W3: round4(ws[2]),
    W4: round4(ws[3]),
    W5: round4(ws[4]),
  };
}
