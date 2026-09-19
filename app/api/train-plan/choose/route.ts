import { NextRequest, NextResponse } from "next/server";
import { submitHumanChoice, pollWorkflowRun, cleanOutputs, hasMeaningfulOutput } from "@/lib/dify";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const { formToken, workflowRunId, choice, userId } = body as Record<string, string>;

  if (!formToken || !workflowRunId || !choice) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  try {
    await submitHumanChoice(formToken, choice, userId || "anonymous");
    const result = await pollWorkflowRun(workflowRunId);

    if (result.status === "failed") {
      return NextResponse.json(
        { error: `Dify 工作流执行失败：${result.error || "未知错误"}` },
        { status: 502 },
      );
    }

    const outputs = cleanOutputs(result.outputs || {});
    if (!hasMeaningfulOutput(outputs)) {
      return NextResponse.json(
        { error: "AI 没有生成有效内容，请重试一次" },
        { status: 502 },
      );
    }

    return NextResponse.json({ outputs });
  } catch (err) {
    console.error("Dify choice submission failed:", err);
    const message = err instanceof Error ? err.message : "提交选择失败，请稍后重试";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
