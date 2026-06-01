import { describe, expect, it } from "vitest";
import { buildAiPrompt, runAiAction } from "./aiService";
import type { ContentProject } from "./domain";

const project: ContentProject = {
  id: "project_demo",
  type: "image_text",
  title: "AI native 图文工作流",
  contentPillar: "Content systems",
  platforms: ["小红书"],
  workflowStatus: "draft",
  currentStage: "image_plan",
  nextAction: "生成图片页规划",
  blockedReason: "",
  priority: "normal",
  targetAudience: "Solo creators",
  promise: "Create reusable image-text workflow",
  goal: "Create a reusable carousel post",
  publishAt: "",
  createdAt: "2026-05-31T00:00:00.000Z",
  updatedAt: "2026-05-31T00:00:00.000Z"
};

describe("AI service", () => {
  it("builds prompts that include project type, references, and AI-native constraints", () => {
    const prompt = buildAiPrompt({
      action: "diagnose_reference",
      project,
      userNotes: "Focus on image and copy structure."
    });

    expect(prompt).toContain("image_text");
    expect(prompt).toContain("小红书");
    expect(prompt).toContain("生成图片页规划");
    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("AI-native content production system");
  });

  it("returns a structured fallback when no OpenAI API key is configured", async () => {
    const result = await runAiAction(
      { action: "publish_pack", project },
      { apiKey: "", model: "gpt-4.1-mini" }
    );

    expect(result.mode).toBe("fallback");
    expect(result.sections.length).toBeGreaterThan(1);
    expect(result.nextChecklist).toContain("导出 Markdown 生产简报");
  });
});
