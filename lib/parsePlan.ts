export interface ParsedExercise {
  name: string;
  content: string;
  duration: string;
  rest: string;
}

export interface ParsedStage {
  title: string;
  note?: string;
  exercises: ParsedExercise[];
}

export interface ParsedPlan {
  name?: string;
  totalTime?: string;
  calories?: string;
  intensity?: string;
  stages: ParsedStage[];
}

function matchField(text: string, label: string): string | undefined {
  const m = text.match(new RegExp(`${label}[:：]\\s*([^\\n]+)`));
  return m?.[1]?.trim();
}

// 训练计划由 LLM 按固定的文字模板生成（计划名称/总用时/卡路里消耗/计划强度 +
// 分阶段的 训练名称/内容/用时/间歇），这里把它解析成结构化数据用于渲染卡片。
// 如果文本不符合这个模板（字段缺失、阶段为空），返回 null，调用方应回退到纯文本展示。
export function parsePlanText(text: string): ParsedPlan | null {
  if (!text) return null;

  const name = matchField(text, "计划名称");
  const totalTime = matchField(text, "总用时");
  const calories = matchField(text, "卡路里消耗");
  const intensity = matchField(text, "计划强度");

  // LLM 偶尔会在一个阶段内部用"3. xxx"这种编号标记具体的动作组/轮次，
  // 这跟"1. 热身阶段"这种真正的阶段标题长得一模一样。只有标题里包含
  // 阶段类关键词时才当作真正的阶段分界，否则会把动作编号误判成新阶段。
  const STAGE_KEYWORDS = /热身|主训|拉伸|收身|放松|冷却|恢复/;
  const stageRegex = /\n?\s*\d+[.、]\s*([^\n]+)\n/g;
  const stageStarts: { title: string; index: number; contentStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = stageRegex.exec(text))) {
    const title = m[1].trim();
    if (!STAGE_KEYWORDS.test(title)) continue;
    stageStarts.push({ title, index: m.index, contentStart: m.index + m[0].length });
  }

  if (stageStarts.length === 0) return null;

  const exerciseRegex =
    /训练名称[:：]\s*([^\n]+)\s*\n\s*内容[:：]\s*([^\n]+)\s*\n\s*用时[:：]\s*([^\n]+)\s*\n\s*间歇[:：]\s*([^\n]+)/g;

  const stages: ParsedStage[] = stageStarts.map((stage, i) => {
    const end = i + 1 < stageStarts.length ? stageStarts[i + 1].index : text.length;
    const block = text.slice(stage.contentStart, end);

    const exercises: ParsedExercise[] = [];
    let firstMatchIndex = block.length;
    let em: RegExpExecArray | null;
    exerciseRegex.lastIndex = 0;
    while ((em = exerciseRegex.exec(block))) {
      if (em.index < firstMatchIndex) firstMatchIndex = em.index;
      exercises.push({
        name: em[1].trim(),
        content: em[2].trim(),
        duration: em[3].trim(),
        rest: em[4].trim(),
      });
    }

    const note = block.slice(0, firstMatchIndex).trim();
    return { title: stage.title, note: note || undefined, exercises };
  });

  const hasAnyExercise = stages.some((s) => s.exercises.length > 0);
  if (!hasAnyExercise) return null;

  return { name, totalTime, calories, intensity, stages };
}
