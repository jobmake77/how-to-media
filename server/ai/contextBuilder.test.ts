import { describe, expect, it } from "vitest";
import { getAvailableActions } from "./actionRegistry";
import { buildActionContext } from "./contextBuilder";
import { createDatabase } from "../repository";

const baseProjectInput = {
  title: "AI 内容生产任务",
  contentPillar: "AI 工作流",
  platforms: ["小红书"],
  targetAudience: "个人创作者",
  promise: "用一套流程稳定产出内容",
  goal: "进入生产流水线"
};

describe("AI action context builder", () => {
  it("returns stage-specific actions from the registry", () => {
    expect(
      getAvailableActions("image_text", "image_plan").map((action) => action.id)
    ).toContain("generate_image_plan");
    expect(
      getAvailableActions("video", "script").map((action) => action.id)
    ).toContain("generate_script");
    expect(
      getAvailableActions("image_text", "script").map((action) => action.id)
    ).not.toContain("generate_script");
  });

  it("fails when a video diagnosis action has no transcript reference", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "video",
      title: "视频诊断任务"
    });

    const context = buildActionContext(db, {
      actionId: "diagnose_video_reference",
      projectId: project.id,
      stage: "diagnosis"
    });

    expect(context.ok).toBe(false);
    if (context.ok) {
      throw new Error("Expected context to fail");
    }
    expect(context.missingInputs).toContain("需要至少一条视频转写稿 reference");

    db.close();
  });

  it("builds context when a video transcript reference exists", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "video",
      title: "视频诊断任务"
    });
    db.createReference({
      projectId: project.id,
      sourceType: "transcript",
      contentType: "video",
      platform: "抖音",
      url: "",
      title: "对标视频转写稿",
      transcript: "开头三秒提出问题，然后给出承诺。",
      notes: "结构值得参考"
    });

    const context = buildActionContext(db, {
      actionId: "diagnose_video_reference",
      projectId: project.id,
      stage: "diagnosis"
    });

    expect(context.ok).toBe(true);
    if (!context.ok) {
      throw new Error("Expected context to succeed");
    }
    expect(context.inputSnapshot.project.id).toBe(project.id);
    expect(context.inputSnapshot.references).toHaveLength(1);
    expect(context.inputSnapshot.action.outputArtifactType).toBe("diagnosis");

    db.close();
  });

  it("validates accepted artifact requirements", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "image_text",
      title: "图文发布任务"
    });

    const missingContext = buildActionContext(db, {
      actionId: "generate_image_publish_pack",
      projectId: project.id,
      stage: "publish_pack"
    });

    expect(missingContext.ok).toBe(false);
    if (missingContext.ok) {
      throw new Error("Expected context to fail");
    }
    expect(missingContext.missingInputs).toContain(
      "需要先接受一份图片规划 artifact"
    );

    const imagePlan = db.createArtifact({
      projectId: project.id,
      type: "image_plan",
      stage: "image_plan",
      title: "图片规划",
      content: "封面、问题定义、方法步骤",
      structuredData: {},
      source: "ai"
    });
    db.acceptArtifact(imagePlan.id);

    const context = buildActionContext(db, {
      actionId: "generate_image_publish_pack",
      projectId: project.id,
      stage: "publish_pack"
    });

    expect(context.ok).toBe(true);
    if (!context.ok) {
      throw new Error("Expected context to succeed");
    }
    expect(context.inputSnapshot.acceptedArtifacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "image_plan" })])
    );

    db.close();
  });

  it("rejects actions unavailable for a stage or content type", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "image_text",
      title: "图文任务"
    });

    const context = buildActionContext(db, {
      actionId: "generate_script",
      projectId: project.id,
      stage: "script"
    });

    expect(context.ok).toBe(false);
    if (context.ok) {
      throw new Error("Expected context to fail");
    }
    expect(context.missingInputs).toContain(
      "当前内容类型或阶段不支持此 AI 动作"
    );

    db.close();
  });

  it("reports missing projects and unknown actions", () => {
    const db = createDatabase(":memory:");
    const missingProject = buildActionContext(db, {
      actionId: "generate_topic_angles",
      projectId: "project_missing",
      stage: "topic"
    });
    const project = db.createProject({
      ...baseProjectInput,
      type: "image_text",
      title: "图文任务"
    });
    const unknownAction = buildActionContext(db, {
      actionId: "unknown_action",
      projectId: project.id,
      stage: "topic"
    });

    expect(missingProject.ok).toBe(false);
    if (missingProject.ok) {
      throw new Error("Expected missing project to fail");
    }
    expect(missingProject.missingInputs).toContain("项目不存在");
    expect(unknownAction.ok).toBe(false);
    if (unknownAction.ok) {
      throw new Error("Expected unknown action to fail");
    }
    expect(unknownAction.missingInputs).toContain("AI 动作不存在");

    db.close();
  });
});
