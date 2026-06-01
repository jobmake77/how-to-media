import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "./repository";

describe("project repository", () => {
  it("creates a production-driven image-text project", () => {
    const db = createDatabase(":memory:");

    const project = db.createProject({
      type: "image_text",
      title: "AI 图文选题",
      contentPillar: "AI 工作流",
      platforms: ["小红书"],
      targetAudience: "个人创作者",
      promise: "用一套流程稳定产出图文",
      goal: "进入图文生产流水线",
      workflowStatus: "idea"
    });

    expect(project.id).toMatch(/^project_/);
    expect(project.workflowStatus).toBe("idea");
    expect(project.currentStage).toBe("topic");
    expect(project.nextAction).toBe("补充对标素材");
    expect(project.platforms).toEqual(["小红书"]);
    expect(project.priority).toBe("normal");
    expect(project.blockedReason).toBe("");
    expect(project.publishAt).toBe("");
    expect(db.listProjects()[0]).toMatchObject({
      id: project.id,
      title: "AI 图文选题",
      platforms: ["小红书"]
    });

    db.close();
  });

  it("creates a production-driven video project", () => {
    const db = createDatabase(":memory:");

    const project = db.createProject({
      type: "video",
      title: "真人出镜 AI 自媒体工作流",
      contentPillar: "AI 视频工作流",
      platforms: ["抖音", "小红书"],
      targetAudience: "个人创作者",
      promise: "用对标和 ASR 稳定产出视频",
      goal: "进入视频生产流水线"
    });

    expect(project.workflowStatus).toBe("idea");
    expect(project.currentStage).toBe("topic");
    expect(project.nextAction).toBe("补充对标视频或转写稿");
    expect(project.platforms).toEqual(["抖音", "小红书"]);

    db.close();
  });

  it("creates and lists references by project", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      type: "image_text",
      title: "AI 图文选题",
      contentPillar: "AI 工作流",
      platforms: ["小红书"],
      targetAudience: "个人创作者",
      promise: "用一套流程稳定产出图文",
      goal: "进入图文生产流水线"
    });

    const attachedReference = db.createReference({
      projectId: project.id,
      sourceType: "url",
      contentType: "image_text",
      platform: "小红书",
      url: "https://example.com/post",
      title: "对标图文",
      notes: "结构值得参考"
    });

    const libraryReference = db.createReference({
      projectId: null,
      sourceType: "note",
      contentType: "mixed",
      platform: "X",
      url: "",
      title: "评论区问题",
      notes: "可以变成下一批选题"
    });

    expect(attachedReference.status).toBe("collected");
    expect(attachedReference.author).toBe("");
    expect(attachedReference.rawText).toBe("");
    expect(attachedReference.transcript).toBe("");
    expect(attachedReference.screenshots).toEqual([]);
    expect(attachedReference.metrics).toEqual({});
    expect(db.listReferences(project.id)).toHaveLength(1);
    expect(db.listReferences()).toHaveLength(2);
    expect(db.listReferences().map((reference) => reference.id)).toContain(
      libraryReference.id
    );

    db.close();
  });

  it("creates, accepts, and archives artifacts", () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      type: "image_text",
      title: "AI 图文选题",
      contentPillar: "AI 工作流",
      platforms: ["小红书"],
      targetAudience: "个人创作者",
      promise: "用一套流程稳定产出图文",
      goal: "进入图文生产流水线"
    });

    const artifact = db.createArtifact({
      projectId: project.id,
      type: "image_plan",
      stage: "image_plan",
      title: "图片页规划",
      content: "第 1 页封面，第 2 页问题定义",
      structuredData: { pages: 2 },
      source: "ai"
    });

    expect(artifact.status).toBe("draft");
    expect(artifact.version).toBe(1);
    expect(db.listArtifacts(project.id)).toHaveLength(1);
    expect(db.acceptArtifact(artifact.id).status).toBe("accepted");
    expect(db.archiveArtifact(artifact.id).status).toBe("archived");

    db.close();
  });

  it("returns undefined for missing projects", () => {
    const db = createDatabase(":memory:");

    expect(db.getProject("project_missing")).toBeUndefined();

    db.close();
  });

  it("migrates legacy project rows to the production-driven shape", () => {
    const directory = mkdtempSync(join(tmpdir(), "how-to-media-"));
    const databasePath = join(directory, "legacy.sqlite");
    const legacyDb = new Database(databasePath);
    legacyDb.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        pillar TEXT NOT NULL,
        platform TEXT NOT NULL,
        status TEXT NOT NULL,
        target_audience TEXT NOT NULL,
        goal TEXT NOT NULL,
        references_json TEXT NOT NULL,
        assets_json TEXT NOT NULL,
        draft TEXT NOT NULL,
        diagnosis_json TEXT NOT NULL,
        checklist_json TEXT NOT NULL,
        metrics_json TEXT NOT NULL,
        retrospective TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    legacyDb
      .prepare(`
        INSERT INTO projects (
          id, type, title, pillar, platform, status, target_audience, goal,
          references_json, assets_json, draft, diagnosis_json, checklist_json,
          metrics_json, retrospective, created_at, updated_at
        ) VALUES (
          'project_legacy', 'image_text', 'Legacy Project', 'Legacy Pillar',
          '小红书 / 公众号', 'idea', '个人创作者', 'Ship a post',
          '[]', '[]', '', '[]', '[]', '{}', '',
          '2026-05-31T00:00:00.000Z', '2026-05-31T00:00:00.000Z'
        )
      `)
      .run();
    legacyDb.close();

    const db = createDatabase(databasePath);
    const project = db.listProjects()[0];

    expect(project).toMatchObject({
      id: "project_legacy",
      title: "Legacy Project",
      contentPillar: "Legacy Pillar",
      platforms: ["小红书", "公众号"],
      workflowStatus: "idea",
      currentStage: "topic",
      nextAction: "补充对标素材",
      targetAudience: "个人创作者",
      promise: "Ship a post",
      goal: "Ship a post"
    });

    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
