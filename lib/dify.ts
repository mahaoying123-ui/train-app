const DIFY_BASE_URL = process.env.DIFY_API_BASE_URL || "https://api.dify.ai/v1";

function authHeaders() {
  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) throw new Error("服务器未配置 DIFY_API_KEY");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// LLM 输出里可能夹带模型的思维链（deepseek-reasoner 等模型会输出 <think> 块），
// 这部分内容不应该展示给最终用户。
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

// Dify 工作流最终输出变量的名字由工作流作者自己定义（比如 text / result / answer），
// 前端不应该假设固定的字段名，因此这里对所有字符串类型的输出统一做思维链清理。
export function cleanOutputs(outputs: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(outputs)) {
    cleaned[key] = typeof value === "string" ? stripThinking(value) : value;
  }
  return cleaned;
}

// LLM 偶尔会生成空内容（或工作流某个环节静默失败），这种情况下 Dify 仍然
// 返回 status: succeeded，但 outputs 是空的。要把它当成明确的错误处理，
// 而不是让前端悄悄展示一个空白结果。
export function hasMeaningfulOutput(outputs: Record<string, unknown>): boolean {
  const values = Object.values(outputs);
  if (values.length === 0) return false;
  return values.some((v) => (typeof v === "string" ? v.trim().length > 0 : v != null));
}

async function* iterateDifyStream(res: Response): AsyncGenerator<Record<string, unknown>> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      try {
        yield JSON.parse(jsonStr);
      } catch {
        // 忽略无法解析的行（如 ping）
      }
    }
  }
}

export interface PlanOption {
  id: string;
  title: string;
  text: string;
}

export interface StartResult {
  workflowRunId: string;
  status: "paused" | "finished";
  formToken?: string;
  options?: PlanOption[];
  outputs?: Record<string, unknown>;
}

// LLM 每次生成的方案标题格式不完全固定（有时带"方案"前缀、有时不带，标题后面
// 跟的可能是全角/半角括号、冒号，或者干脆一个空格），所以按多种规律尝试切分，
// 拆不干净时兜底成"按空行分段、按顺序对应每个选项"，保证每张卡片显示的内容
// 至少不会是"全部选项拼在一起"。
function splitPlanOptions(text: string, ids: string[]): Record<string, string> {
  const headerRegex = /(?:^|\n)\s*(?:方案)?([A-D])(?=[（(：:\s])/g;
  const matches: { id: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(text))) {
    matches.push({ id: m[1], index: m.index });
  }

  // 同一个字母只认第一次出现的位置，避免正文里偶然出现的字母被误判成新方案的开头
  const seenIds = new Set<string>();
  const headers = matches.filter((match) => {
    if (seenIds.has(match.id)) return false;
    seenIds.add(match.id);
    return true;
  });

  const sections: Record<string, string> = {};

  if (headers.length === ids.length) {
    headers.forEach((match, i) => {
      const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
      sections[match.id] = text.slice(match.index, end).trim();
    });
    return sections;
  }

  // 兜底：按空行分段，第 N 段对应第 N 个选项
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length >= ids.length) {
    ids.forEach((id, i) => {
      sections[id] = paragraphs[i];
    });
    return sections;
  }

  // 实在拆不出来：所有选项共用完整文本，至少不会一片空白
  ids.forEach((id) => {
    sections[id] = text;
  });
  return sections;
}

interface HumanInputForm {
  form_content?: string;
  user_actions?: { id: string; title: string }[];
}

async function getHumanInputForm(formToken: string): Promise<HumanInputForm> {
  const res = await fetch(`${DIFY_BASE_URL}/form/human_input/${formToken}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("获取人工选择表单失败");
  return res.json();
}

export async function startTrainingWorkflow(
  inputs: Record<string, unknown>,
  user: string,
): Promise<StartResult> {
  const res = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ inputs, response_mode: "streaming", user }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}) as Record<string, unknown>);
    throw new Error((data as { message?: string }).message || `Dify 请求失败（${res.status}）`);
  }

  let workflowRunId = "";
  let formToken: string | undefined;
  let finished: Record<string, unknown> | null = null;

  for await (const evt of iterateDifyStream(res)) {
    const runId = (evt.workflow_run_id as string) || "";
    if (runId) workflowRunId = runId;
    if (evt.event === "human_input_required") {
      formToken = (evt.data as { form_token?: string })?.form_token;
      break;
    }
    if (evt.event === "workflow_finished") {
      finished = evt.data as Record<string, unknown>;
      break;
    }
  }

  if (formToken) {
    const form = await getHumanInputForm(formToken);
    const cleanedContent = stripThinking(form.form_content || "");
    const actions = form.user_actions || [];
    const sections = splitPlanOptions(
      cleanedContent,
      actions.map((a) => a.id),
    );
    const options: PlanOption[] = actions.map((action) => ({
      id: action.id,
      title: action.title,
      text: sections[action.id] || cleanedContent,
    }));
    return { workflowRunId, status: "paused", formToken, options };
  }

  if (finished) {
    if (finished.status === "failed") {
      throw new Error(`Dify 工作流执行失败：${finished.error || "未知错误"}`);
    }
    const outputs = cleanOutputs((finished.outputs as Record<string, unknown>) || {});
    if (!hasMeaningfulOutput(outputs)) {
      throw new Error("AI 没有生成有效内容，请重试一次");
    }
    return { workflowRunId, status: "finished", outputs };
  }

  throw new Error("Dify 工作流没有返回预期的结果");
}

export async function submitHumanChoice(formToken: string, actionId: string, user: string) {
  const res = await fetch(`${DIFY_BASE_URL}/form/human_input/${formToken}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ inputs: {}, action: actionId, user }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}) as Record<string, unknown>);
    throw new Error((data as { message?: string }).message || "提交选择失败");
  }
}

interface WorkflowRunStatus {
  status: string;
  outputs?: Record<string, unknown>;
  error?: string;
}

export async function pollWorkflowRun(
  workflowRunId: string,
  timeoutMs = 90000,
): Promise<WorkflowRunStatus> {
  const start = Date.now();
  let lastSeen: WorkflowRunStatus | null = null;

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${DIFY_BASE_URL}/workflows/run/${workflowRunId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("查询 Dify 工作流状态失败");
    const data = (await res.json()) as WorkflowRunStatus;
    lastSeen = data;

    const isRunning = !data.status || data.status === "running";
    if (!isRunning) {
      // Dify 那边状态和 outputs 的写入不是原子的：状态可能先变成终态，
      // outputs 字段过几秒才补齐。失败可以立刻确定，但"终态却没有内容"
      // 还不能立刻判定为失败，继续轮询直到超时，避免把这个短暂的空窗期
      // 误判成"AI 没有生成内容"。
      if (data.status === "failed" || (data.outputs && Object.keys(data.outputs).length > 0)) {
        return data;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (lastSeen) return lastSeen;
  throw new Error("等待 Dify 生成结果超时，请重试");
}
