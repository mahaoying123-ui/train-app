export interface Option {
  value: string;
  label: string;
}

export const PHYSICAL_STATUS_OPTIONS: Option[] = [
  { value: "high", label: "状态良好" },
  { value: "middle", label: "一般" },
  { value: "low", label: "较差" },
];

export const ENERGY_STATUS_OPTIONS: Option[] = [
  { value: "high", label: "精力充沛" },
  { value: "middle", label: "一般" },
  { value: "low", label: "疲惫" },
];

export const INJURY_NO = "no, i haven't";
export const INJURY_YES = "yes, i have";

export const INJURY_OPTIONS: Option[] = [
  { value: INJURY_NO, label: "无伤病" },
  { value: INJURY_YES, label: "有伤病" },
];

export const NO_INJURY_VALUE = "I don't have injury";

export const INJURY_PLACE_OPTIONS: Option[] = [
  { value: "ankle", label: "脚踝" },
  { value: "knee", label: "膝盖" },
  { value: "lower back", label: "腰部" },
  { value: "shoulder", label: "肩部" },
  { value: "wrist", label: "手腕" },
  { value: "elbow", label: "肘部" },
  { value: "hip", label: "髋部" },
  { value: "calf", label: "小腿" },
];

export const INJURY_SEVERITY_OPTIONS: Option[] = [
  { value: "Mild", label: "轻微" },
  { value: "Moderate", label: "中等" },
  { value: "Severe", label: "严重" },
];

export const AVAILABLE_TIME_OPTIONS: Option[] = [
  { value: "5min", label: "5 分钟" },
  { value: "15min", label: "15 分钟" },
  { value: "30min", label: "30 分钟" },
  { value: "60min", label: "60 分钟" },
];

// value 必须与 Dify Workflow 里配置的选项文本完全一致（含中文说明和全角冒号），
// 因此这里直接把 Dify 的原始选项文本同时用作 value 和展示文案。
export const TRAIN_GOAL_OPTIONS: Option[] = [
  { value: "fat loss：降低体脂率，让身材更瘦更紧致", label: "减脂：降低体脂率，让身材更瘦更紧致" },
  { value: "muscle gain：增加肌肉量，提高维度和力量感", label: "增肌：增加肌肉量，提高维度和力量感" },
  { value: "strength：提高最大力量", label: "力量：提高最大力量" },
  { value: "endurance：提高持续运动能力", label: "耐力：提高持续运动能力" },
  { value: "flexibility：提高关节活动范围，减少受伤风险", label: "柔韧性：提高关节活动范围，减少受伤风险" },
];

export function findLabel(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
