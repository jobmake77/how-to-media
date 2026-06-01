import { describe, expect, it } from "vitest";
import { buildWorkbenchState } from "./workbench";
import { createDatabase } from "../repository";

const createProjectInput = {
  title: "AI 图文选题",
  contentPillar: "AI 工作流",
  platforms: ["小红书"],
  targetAudience: "个人创作者",
  promise: "用一套流程稳定产出内容",
  goal: "进入生产流水线"
};

describe("workbench aggregation", () => {
  it("builds status columns with project cards and production counts", () => {
    const db = createDatabase(":memory:");
    const now = new Date();
    const publishAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const ideaProject = db.createProject({
      ...createProjectInput,
      type: "image_text",
      title: "AI 图文选题",
      workflowStatus: "idea"
    });
    const videoProject = db.createProject({
      ...createProjectInput,
      type: "video",
      title: "AI 视频脚本",
      workflowStatus: "reference"
    });
    const readyProject = db.createProject({
      ...createProjectInput,
      type: "image_text",
      title: "待发布图文",
      workflowStatus: "ready"
    });
    db.updateProject({ ...readyProject, publishAt });

    db.createReference({
      projectId: ideaProject.id,
      sourceType: "url",
      contentType: "image_text",
      platform: "小红书",
      url: "https://example.com/post",
      title: "对标图文",
      notes: "结构值得参考"
    });
    db.createArtifact({
      projectId: videoProject.id,
      type: "script",
      stage: "draft",
      title: "口播稿",
      content: "开头、论点、CTA",
      structuredData: {},
      source: "ai"
    });

    const state = buildWorkbenchState(db);

    expect(state.columns.map((column) => column.status)).toEqual([
      "idea",
      "reference",
      "draft",
      "production",
      "ready",
      "published",
      "reviewed"
    ]);
    expect(state.columns[0].title).toBe("选题池");
    expect(state.summary.totalProjects).toBe(3);
    expect(
      state.columns
        .find((column) => column.status === "idea")
        ?.cards.find((card) => card.id === ideaProject.id)?.referenceCount
    ).toBe(1);
    expect(
      state.columns
        .find((column) => column.status === "reference")
        ?.cards.find((card) => card.id === videoProject.id)?.artifactCount
    ).toBe(1);
    expect(state.summary.readyThisWeek).toBe(1);

    db.close();
  });

  it("summarizes blocked projects and AI queue state", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...createProjectInput,
      type: "video",
      title: "视频生产任务",
      workflowStatus: "draft"
    });
    db.updateProject({ ...project, blockedReason: "缺少转写稿" });

    db.createAiJob({
      projectId: project.id,
      stage: "draft",
      action: "生成脚本",
      scope: "project",
      status: "running",
      inputSnapshot: {},
      output: {},
      outputArtifactId: null,
      acceptedTarget: "",
      error: ""
    });
    db.createAiJob({
      projectId: project.id,
      stage: "draft",
      action: "诊断脚本",
      scope: "project",
      status: "awaiting_review",
      inputSnapshot: {},
      output: {},
      outputArtifactId: "artifact_1",
      acceptedTarget: "artifact",
      error: ""
    });
    db.createAiJob({
      projectId: project.id,
      stage: "draft",
      action: "生成发布包",
      scope: "project",
      status: "failed",
      inputSnapshot: {},
      output: {},
      outputArtifactId: null,
      acceptedTarget: "",
      error: "model timeout"
    });

    const state = buildWorkbenchState(db);
    const card = state.columns
      .find((column) => column.status === "draft")
      ?.cards.find((item) => item.id === project.id);

    expect(state.summary.blockedProjects).toBe(1);
    expect(state.summary.aiRunning).toBe(1);
    expect(state.summary.awaitingReview).toBe(1);
    expect(state.aiQueue.running).toHaveLength(1);
    expect(state.aiQueue.awaitingReview).toHaveLength(1);
    expect(state.aiQueue.failed).toHaveLength(1);
    expect(card?.aiState).toBe("failed");

    db.close();
  });
});
