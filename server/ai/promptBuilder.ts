import type { AiActionDefinition } from "./actionRegistry";
import type { ActionInputSnapshot } from "./contextBuilder";

export interface PromptBuildInput {
  action: AiActionDefinition;
  inputSnapshot: ActionInputSnapshot;
}

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(input: PromptBuildInput): BuiltPrompt {
  const { action, inputSnapshot } = input;
  const { project } = inputSnapshot;

  return {
    system:
      "你是一个 AI-native 自媒体生产助手，负责把项目上下文转化为可审阅的结构化生产草稿。",
    user: [
      `AI 动作：${action.label}`,
      `项目标题：${project.title}`,
      `内容类型：${project.type}`,
      `当前阶段：${inputSnapshot.stage}`,
      `目标受众：${project.targetAudience}`,
      `内容承诺：${project.promise}`,
      `参考素材：${summarizeReferences(inputSnapshot.references)}`,
      `已接受产物：${summarizeArtifacts(inputSnapshot.acceptedArtifacts)}`,
      "请输出可直接进入人工审阅的内容草稿。"
    ].join("\n")
  };
}

function summarizeReferences(
  references: ActionInputSnapshot["references"]
): string {
  if (references.length === 0) {
    return "暂无";
  }

  return references
    .map((reference) => {
      const text = reference.transcript || reference.rawText || reference.notes;
      return `${reference.title}（${reference.platform}）：${text.slice(0, 80)}`;
    })
    .join("；");
}

function summarizeArtifacts(
  artifacts: ActionInputSnapshot["acceptedArtifacts"]
): string {
  if (artifacts.length === 0) {
    return "暂无";
  }

  return artifacts
    .map((artifact) => `${artifact.title}（${artifact.type}）：${artifact.content.slice(0, 80)}`)
    .join("；");
}
