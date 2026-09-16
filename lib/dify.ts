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

// LLM 每次生成的方案标题格式不完全固定（有时带“方案”前缀，有时不带），
// 因此按“段落开头是一个大写字母 + 括号/冒号”这个更宽松的规律来切分每个方案。
function splitPlanSections(text: string): Record<string, string> {
  const headerRegex = /(?:^|\n)\s*(?:方案)?([A-D])(?=[（(：:])/g;
  const matches: { id: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(text))) {
    matches.push({ id: m[1], index: m.index });
  }
  const sections: Record<string, string> = {};
  matches.forEach((match, i) => {
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    sections[match.id] = text.slice(match.index, end).trim();
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
    const sections = splitPlanSections(cleanedContent);
    const options: PlanOption[] = (form.user_actions || []).map((action) => ({
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
    const outputs = (finished.outputs as Record<string, unknown>) || {};
    return { workflowRunId, status: "finished", outputs: cleanOutputs(outputs) };
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
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${DIFY_BASE_URL}/workflows/run/${workflowRunId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("查询 Dify 工作流状态失败");
    const data = (await res.json()) as WorkflowRunStatus;
    if (data.status && data.status !== "running") {
      return data;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("等待 Dify 生成结果超时，请重试");
}
