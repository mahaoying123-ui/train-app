import { NextRequest, NextResponse } from "next/server";
import { NO_INJURY_VALUE, INJURY_YES } from "@/lib/formOptions";
import { startTrainingWorkflow } from "@/lib/dify";
import { calculateWeights } from "@/lib/calculateWeights";

// Vercel Hobby 计划里 Serverless 函数最长允许跑到 60 秒；这里显式声明，
// 避免不同环境下的默认值（有的低至 10 秒）过早掐断这个较慢的请求。
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });
  }

  const {
    physical_status,
    energy_status,
    do_you_have_injury,
    the_place_of_injury,
    the_severity_of_injury,
    available_time,
    train_goal,
    userId,
  } = body as Record<string, string>;

  const requiredFields: Record<string, string | undefined> = {
    physical_status,
    energy_status,
    do_you_have_injury,
    available_time,
    train_goal,
  };
  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value) {
      return NextResponse.json({ error: `缺少必填字段: ${key}` }, { status: 400 });
    }
  }

  const hasInjury = do_you_have_injury === INJURY_YES;
  if (hasInjury && (!the_place_of_injury || !the_severity_of_injury)) {
    return NextResponse.json(
      { error: "请填写受伤部位和受伤严重程度" },
      { status: 400 },
    );
  }

  // Dify 的 `id` 输入变量声明为 number 类型，不能传 UUID 字符串。
  const numericId = Date.now();

  const finalSeverity = hasInjury ? the_severity_of_injury : NO_INJURY_VALUE;

  // 原来由 Dify 里的 Python 节点计算，现在挪到我们自己的后端算，
  // 不再依赖 Dify 的代码执行沙箱。
  const weights = calculateWeights({
    physicalStatus: physical_status,
    energyStatus: energy_status,
    doYouHaveInjury: do_you_have_injury,
    theSeverityOfInjury: finalSeverity,
    trainGoal: train_goal,
  });

  const inputs = {
    id: numericId,
    physical_status,
    energy_status,
    do_you_have_injury,
    the_place_of_injury: hasInjury ? the_place_of_injury : NO_INJURY_VALUE,
    the_severity_of_injury: finalSeverity,
    available_time,
    train_goal,
    ...weights,
  };

  try {
    const result = await startTrainingWorkflow(inputs, userId || String(numericId));

    if (result.status === "paused") {
      return NextResponse.json({
        stage: "choose",
        workflowRunId: result.workflowRunId,
        formToken: result.formToken,
        options: result.options,
      });
    }

    return NextResponse.json({
      stage: "done",
      outputs: result.outputs,
    });
  } catch (err) {
    console.error("Dify request failed:", err);
    const message = err instanceof Error ? err.message : "无法连接到 Dify，请稍后重试";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
