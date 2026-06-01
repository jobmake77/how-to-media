import OpenAI from "openai";
import type { BuiltPrompt } from "./promptBuilder";

export interface ModelClientOptions {
  apiKey?: string;
  model: string;
}

export interface ModelArtifactOutput {
  title: string;
  content: string;
  structuredData: Record<string, unknown>;
}

export async function generateArtifactOutput(
  prompt: BuiltPrompt,
  options: ModelClientOptions
): Promise<ModelArtifactOutput> {
  if (!options.apiKey) {
    return {
      title: "AI 草稿",
      content: `基于以下上下文生成的可审阅草稿：\n${prompt.user}`,
      structuredData: { mode: "fallback" }
    };
  }

  const client = new OpenAI({ apiKey: options.apiKey });
  const response = await client.responses.create({
    model: options.model,
    input: [
      {
        role: "system",
        content: prompt.system
      },
      {
        role: "user",
        content: `${prompt.user}\n\n请返回 JSON：{"title": string, "content": string, "structuredData": object}`
      }
    ],
    text: {
      format: {
        type: "json_object"
      }
    }
  });

  return parseModelOutput(response.output_text);
}

function parseModelOutput(outputText: string): ModelArtifactOutput {
  try {
    const parsed = JSON.parse(outputText) as Partial<ModelArtifactOutput>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "AI 草稿",
      content:
        typeof parsed.content === "string" ? parsed.content : outputText,
      structuredData:
        parsed.structuredData && typeof parsed.structuredData === "object"
          ? parsed.structuredData
          : { mode: "model" }
    };
  } catch {
    return {
      title: "AI 草稿",
      content: outputText,
      structuredData: { mode: "model", parseFallback: true }
    };
  }
}
