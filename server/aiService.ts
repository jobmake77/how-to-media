import OpenAI from "openai";
import type { AiRunInput, AiRunResult } from "./domain";

export interface AiConfig {
  apiKey?: string;
  model: string;
}

const actionLabels: Record<AiRunInput["action"], string> = {
  ideate: "生成差异化选题角度",
  diagnose_reference: "诊断对标内容",
  draft: "生成可制作草稿",
  optimize: "诊断并优化草稿",
  repurpose: "复用为其他内容形态",
  publish_pack: "生成平台发布包",
  retrospective: "复盘数据并生成下一步行动"
};

export function buildAiPrompt(input: AiRunInput): string {
  const { action, project, userNotes } = input;

  return `
You are designing an AI-native content production system for a solo creator.
The workflow must preserve creator judgment while using AI for diagnosis,
drafting, critique, repurposing, publishing packages, and retrospectives.

Action: ${action} - ${actionLabels[action]}
Project type: ${project.type}
Title: ${project.title}
Content pillar: ${project.contentPillar}
Platforms: ${project.platforms.join(", ")}
Target audience: ${project.targetAudience}
Promise: ${project.promise}
Goal: ${project.goal}
Status: ${project.workflowStatus}
Current stage: ${project.currentStage}
Next action: ${project.nextAction}

User notes:
${userNotes || "(none)"}

Return JSON only using this exact shape:
{
  "summary": "short strategic summary",
  "sections": [
    {
      "title": "section title",
      "body": "concise body",
      "items": ["specific actionable item"]
    }
  ],
  "nextChecklist": ["specific next action"]
}
`.trim();
}

function fallbackResult(input: AiRunInput): AiRunResult {
  const typeLabel =
    input.project.type === "video" ? "视频项目" : "图文项目";

  return {
    action: input.action,
    mode: "fallback",
    summary: `当前使用离线策略，为${typeLabel}执行「${actionLabels[input.action]}」。配置 OpenAI API Key 后会切换为模型生成。`,
    sections: [
      {
        title: "策略框架",
        body: `围绕目标用户「${input.project.targetAudience}」和目标「${input.project.goal}」推进，不要让内容发散。`,
        items: [
          "明确读者或观众当前最具体的痛点",
          "用具体语言说清这条内容承诺带来的结果",
          "保留一个清晰角度，避免把多个无关主题混在一起"
        ]
      },
      {
        title:
          input.project.type === "video"
            ? "视频生产路径"
            : "图文生产路径",
        body:
          input.project.type === "video"
            ? "从对标采集进入转写、诊断、口播稿、录制、粗剪和最终剪辑。"
            : "从对标诊断进入封面承诺、图片页顺序、正文、发布文案和发布检查。",
        items:
          input.project.type === "video"
            ? [
                "为每条对标视频粘贴 ASR 转写稿",
                "提取开头、结构、证据、节奏和 CTA",
                "写出读起来像真人表达的口播稿"
              ]
            : [
                "给每张图分配一个明确阅读任务",
                "用正文补充上下文和平台关键词",
                "用清单、模板或步骤提升收藏价值"
              ]
      },
      {
        title: "AI 原生下一步",
        body: "把每次输出都当成可诊断、可复用、可衡量的生产简报。",
        items: [
          "制作或录制前先运行诊断",
          "导出 Markdown 生产简报",
          "发布后把评论问题沉淀为下一批选题"
        ]
      }
    ],
    nextChecklist: [
      "收集对标内容",
      "发布或录制前运行 AI 诊断",
      "导出 Markdown 生产简报"
    ]
  };
}

function parseAiJson(text: string, input: AiRunInput): AiRunResult {
  const parsed = JSON.parse(text) as Omit<AiRunResult, "action" | "mode">;
  return {
    action: input.action,
    mode: "model",
    summary: parsed.summary,
    sections: parsed.sections,
    nextChecklist: parsed.nextChecklist
  };
}

export async function runAiAction(
  input: AiRunInput,
  config: AiConfig
): Promise<AiRunResult> {
  if (!config.apiKey) {
    return fallbackResult(input);
  }

  const client = new OpenAI({ apiKey: config.apiKey });
  const response = await client.responses.create({
    model: config.model,
    input: buildAiPrompt(input),
    text: {
      format: {
        type: "json_schema",
        name: "content_workflow_result",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["summary", "sections", "nextChecklist"],
          properties: {
            summary: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "body", "items"],
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                  items: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            nextChecklist: {
              type: "array",
              items: { type: "string" }
            }
          }
        },
        strict: true
      }
    }
  });

  return parseAiJson(response.output_text, input);
}
