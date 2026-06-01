import { describe, expect, it } from "vitest";
import { runAiJob } from "./aiJobRunner";
import { createDatabase } from "../repository";

const baseProjectInput = {
  title: "AI 内容生产任务",
  contentPillar: "AI 工作流",
  platforms: ["小红书"],
  targetAudience: "个人创作者",
  promise: "用一套流程稳定产出内容",
  goal: "进入生产流水线"
};

async function runImagePlanJob() {
  const db = createDatabase(":memory:");
  const project = db.createProject({
    ...baseProjectInput,
    type: "image_text",
    title: "图文生产任务"
  });
  const job = await runAiJob(
    db,
    {
      actionId: "generate_image_plan",
      projectId: project.id,
      stage: "image_plan"
    },
    { apiKey: "", model: "gpt-4.1-mini" }
  );

  return { db, project, job };
}

describe("AI job runner", () => {
  it("creates a draft artifact and awaiting-review job through fallback output", async () => {
    const { db, project, job } = await runImagePlanJob();
    const artifacts = db.listArtifacts(project.id);

    expect(job.status).toBe("awaiting_review");
    expect(job.outputArtifactId).not.toBeNull();
    expect(job.acceptedTarget).toBe("artifact");
    expect(job.inputSnapshot).toMatchObject({
      project: expect.objectContaining({ id: project.id }),
      action: expect.objectContaining({
        id: "generate_image_plan",
        outputArtifactType: "image_plan"
      })
    });
    expect(artifacts[0]).toMatchObject({
      type: "image_plan",
      source: "ai",
      status: "draft"
    });

    db.close();
  });

  it("accepts an AI job and its output artifact", async () => {
    const { db, project, job } = await runImagePlanJob();

    const accepted = db.acceptAiJob(job.id);

    expect(accepted.status).toBe("accepted");
    expect(db.listArtifacts(project.id)[0].status).toBe("accepted");

    db.close();
  });

  it("rejects an AI job and archives its output artifact", async () => {
    const { db, project, job } = await runImagePlanJob();

    const rejected = db.rejectAiJob(job.id);

    expect(rejected.status).toBe("rejected");
    expect(db.listArtifacts(project.id)[0].status).toBe("archived");

    db.close();
  });

  it("creates a failed job without artifacts when context is missing", async () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "video",
      title: "视频诊断任务"
    });

    const job = await runAiJob(
      db,
      {
        actionId: "diagnose_video_reference",
        projectId: project.id,
        stage: "diagnosis"
      },
      { apiKey: "", model: "gpt-4.1-mini" }
    );

    expect(job.status).toBe("failed");
    expect(job.error).toContain("需要至少一条视频转写稿 reference");
    expect(db.listArtifacts(project.id)).toHaveLength(0);

    db.close();
  });

  it("advances an image-text project through diagnosis, image plan, and publish pack acceptance", async () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "image_text",
      title: "图文闭环任务"
    });
    db.createReference({
      projectId: project.id,
      sourceType: "url",
      contentType: "image_text",
      platform: "小红书",
      url: "https://example.com/post-a",
      title: "对标图文 A",
      notes: "结构参考"
    });
    db.createReference({
      projectId: project.id,
      sourceType: "url",
      contentType: "image_text",
      platform: "小红书",
      url: "https://example.com/post-b",
      title: "对标图文 B",
      notes: "标题参考"
    });

    const diagnosis = await runAiJob(
      db,
      {
        actionId: "diagnose_image_references",
        projectId: project.id,
        stage: "diagnosis"
      },
      { apiKey: "", model: "gpt-4.1-mini" }
    );
    db.acceptAiJob(diagnosis.id);
    expect(db.getProject(project.id)).toMatchObject({
      workflowStatus: "draft",
      currentStage: "image_plan",
      nextAction: "生成图片规划"
    });

    const imagePlan = await runAiJob(
      db,
      {
        actionId: "generate_image_plan",
        projectId: project.id,
        stage: "image_plan"
      },
      { apiKey: "", model: "gpt-4.1-mini" }
    );
    db.acceptAiJob(imagePlan.id);
    expect(db.getProject(project.id)).toMatchObject({
      workflowStatus: "production",
      currentStage: "publish_pack",
      nextAction: "生成图文发布包"
    });

    const publishPack = await runAiJob(
      db,
      {
        actionId: "generate_image_publish_pack",
        projectId: project.id,
        stage: "publish_pack"
      },
      { apiKey: "", model: "gpt-4.1-mini" }
    );
    db.acceptAiJob(publishPack.id);
    expect(db.getProject(project.id)).toMatchObject({
      workflowStatus: "ready",
      currentStage: "publish_pack",
      nextAction: "检查并发布"
    });

    db.close();
  });

  it("advances a video project through diagnosis, script, and cut list acceptance", async () => {
    const db = createDatabase(":memory:");
    const project = db.createProject({
      ...baseProjectInput,
      type: "video",
      title: "视频闭环任务"
    });
    db.createReference({
      projectId: project.id,
      sourceType: "transcript",
      contentType: "video",
      platform: "抖音",
      url: "https://example.com/video",
      title: "视频转写稿",
      notes: "开头结构参考",
      transcript: "开头三秒提出问题，然后给出承诺。"
    });

    const diagnosis = await runAiJob(
      db,
      {
        actionId: "diagnose_video_reference",
        projectId: project.id,
        stage: "diagnosis"
      },
      { apiKey: "", model: "gpt-4.1-mini" }
    );
    db.acceptAiJob(diagnosis.id);
    expect(db.getProject(project.id)).toMatchObject({
      workflowStatus: "draft",
      currentStage: "script",
      nextAction: "生成口播脚本"
    });

    const script = await runAiJob(
      db,
      {
        actionId: "generate_script",
        projectId: project.id,
        stage: "script"
      },
      { apiKey: "", model: "gpt-4.1-mini" }
    );
    db.acceptAiJob(script.id);
    expect(db.getProject(project.id)).toMatchObject({
      workflowStatus: "production",
      currentStage: "edit_plan",
      nextAction: "生成剪辑清单"
    });

    const cutList = await runAiJob(
      db,
      {
        actionId: "generate_cut_list",
        projectId: project.id,
        stage: "edit_plan"
      },
      { apiKey: "", model: "gpt-4.1-mini" }
    );
    db.acceptAiJob(cutList.id);
    expect(db.getProject(project.id)).toMatchObject({
      workflowStatus: "ready",
      currentStage: "publish_pack",
      nextAction: "检查剪辑清单并准备发布"
    });

    db.close();
  });
});
