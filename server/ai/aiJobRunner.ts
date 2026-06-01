import type { AiJob } from "../domain";
import type { createDatabase } from "../repository";
import { buildActionContext } from "./contextBuilder";
import { generateArtifactOutput, type ModelClientOptions } from "./modelClient";
import { buildPrompt } from "./promptBuilder";

export interface RunAiJobInput {
  actionId: string;
  projectId: string;
  stage: string;
}

export async function runAiJob(
  repository: ReturnType<typeof createDatabase>,
  input: RunAiJobInput,
  options: ModelClientOptions
): Promise<AiJob> {
  let job = repository.createAiJob({
    projectId: input.projectId,
    stage: input.stage,
    action: input.actionId,
    scope: "project",
    status: "queued",
    inputSnapshot: {},
    output: {},
    outputArtifactId: null,
    acceptedTarget: "",
    error: ""
  });

  job = repository.updateAiJob({ ...job, status: "running" });

  try {
    const context = buildActionContext(repository, input);
    if (!context.ok) {
      return repository.updateAiJob({
        ...job,
        status: "failed",
        error: context.missingInputs.join("；")
      });
    }

    const prompt = buildPrompt({
      action: context.action,
      inputSnapshot: context.inputSnapshot
    });
    const output = await generateArtifactOutput(prompt, options);
    const artifact = repository.createArtifact({
      projectId: input.projectId,
      type: context.action.outputArtifactType,
      stage: input.stage,
      title: output.title,
      content: output.content,
      structuredData: output.structuredData,
      source: "ai"
    });

    return repository.updateAiJob({
      ...job,
      status: "awaiting_review",
      inputSnapshot: context.inputSnapshot as unknown as Record<string, unknown>,
      output: output as unknown as Record<string, unknown>,
      outputArtifactId: artifact.id,
      acceptedTarget: context.action.acceptedTarget,
      error: ""
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return repository.updateAiJob({
      ...job,
      status: "failed",
      error: `AI 任务执行失败：${message}`
    });
  }
}
