import { describe, expect, it } from "vitest";
import { buildStudioState } from "./studio";
import { createDatabase } from "../repository";

const baseProjectInput = {
  title: "AI 内容生产任务",
  contentPillar: "AI 工作流",
  platforms: ["小红书"],
  targetAudience: "个人创作者",
  promise: "用一套流程稳定产出内容",
  goal: "进入生产流水线"
};

describe("studio aggregation", () => {
  it("builds an image-text studio with stages, resources, and AI jobs", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "image_text",
      title: "AI 图文选题"
    });

    db.createReference({
      projectId: project.id,
      sourceType: "url",
      contentType: "image_text",
      platform: "小红书",
      url: "https://example.com/post",
      title: "对标图文",
      notes: "结构值得参考"
    });
    const acceptedArtifact = db.createArtifact({
      projectId: project.id,
      type: "image_plan",
      stage: "image_plan",
      title: "图片页规划",
      content: "第 1 页封面，第 2 页问题定义",
      structuredData: { pages: 2 },
      source: "ai"
    });
    db.acceptArtifact(acceptedArtifact.id);
    db.createArtifact({
      projectId: project.id,
      type: "body_copy",
      stage: "body_caption",
      title: "正文草稿",
      content: "正文内容",
      structuredData: {},
      source: "human"
    });
    db.createAiJob({
      projectId: project.id,
      stage: "body_caption",
      action: "生成图文草稿",
      scope: "project",
      status: "awaiting_review",
      inputSnapshot: {},
      output: {},
      outputArtifactId: acceptedArtifact.id,
      acceptedTarget: "artifact",
      error: ""
    });

    const studio = buildStudioState(db, project.id);

    expect(studio).toBeDefined();
    expect(studio?.project.id).toBe(project.id);
    expect(studio?.stages.map((stage) => stage.id)).toEqual([
      "topic",
      "references",
      "diagnosis",
      "title_cover",
      "image_plan",
      "body_caption",
      "publish_pack",
      "retrospective"
    ]);
    expect(studio?.stages[0].label).toBe("选题定义");
    expect(studio?.currentStage.id).toBe("topic");
    expect(studio?.references).toHaveLength(1);
    expect(studio?.acceptedArtifacts).toHaveLength(1);
    expect(studio?.draftArtifacts).toHaveLength(1);
    expect(studio?.availableAiActions.length).toBeGreaterThan(0);
    expect(studio?.relatedAiJobs).toHaveLength(1);

    db.close();
  });

  it("builds a video studio with video stages and script actions", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "video",
      title: "AI 视频脚本"
    });
    db.updateProject({ ...project, currentStage: "script" });
    db.createReference({
      projectId: project.id,
      sourceType: "url",
      contentType: "video",
      platform: "抖音",
      url: "https://example.com/video",
      title: "对标视频",
      notes: "开头节奏值得参考"
    });

    const studio = buildStudioState(db, project.id);

    expect(studio?.stages.map((stage) => stage.id)).toEqual([
      "topic",
      "reference_videos",
      "asr_transcript",
      "diagnosis",
      "script",
      "recording_plan",
      "edit_plan",
      "publish_pack",
      "retrospective"
    ]);
    expect(studio?.currentStage.id).toBe("script");
    expect(studio?.references).toHaveLength(1);
    expect(studio?.availableAiActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "generate_script", stage: "script" })
      ])
    );

    db.close();
  });

  it("returns undefined for missing projects", () => {
    const db = createDatabase(":memory:");

    expect(buildStudioState(db, "project_missing")).toBeUndefined();

    db.close();
  });
});
