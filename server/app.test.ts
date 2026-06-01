import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("API app", () => {
  it("serves legacy workflow templates while the workbench UI is being replaced", async () => {
    const { app, repository } = createApp({
      databasePath: ":memory:",
      openAiApiKey: "",
      openAiModel: "gpt-4.1-mini"
    });

    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not start on a port");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/templates`
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "image_text",
          name: "AI 原生图文工作流"
        }),
        expect.objectContaining({
          type: "video",
          name: "AI 原生视频工作流"
        })
      ])
    );

    server.close();
    repository.close();
  });

  it("creates projects and runs AI fallback through HTTP handlers", async () => {
    const { app, repository } = createApp({
      databasePath: ":memory:",
      openAiApiKey: "",
      openAiModel: "gpt-4.1-mini"
    });

    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not start on a port");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const createResponse = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "image_text",
        title: "AI 图文工作流",
        contentPillar: "AI workflow",
        platforms: ["小红书"],
        targetAudience: "Independent creators",
        promise: "Create a reusable carousel workflow",
        goal: "Publish one carousel"
      })
    });

    expect(createResponse.status).toBe(201);
    const project = (await createResponse.json()) as { id: string };

    const aiResponse = await fetch(`${baseUrl}/api/ai/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ideate",
        projectId: project.id,
        userNotes: "Need concrete angles."
      })
    });

    expect(aiResponse.status).toBe(200);
    await expect(aiResponse.json()).resolves.toMatchObject({
      action: "ideate",
      mode: "fallback"
    });

    server.close();
    repository.close();
  });

  it("serves the workbench aggregate", async () => {
    const { app, repository } = createApp({
      databasePath: ":memory:",
      openAiApiKey: "",
      openAiModel: "gpt-4.1-mini"
    });

    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not start on a port");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/workbench`
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      summary: expect.any(Object),
      columns: expect.any(Array),
      aiQueue: expect.any(Object)
    });

    server.close();
    repository.close();
  });

  it("serves a project studio aggregate", async () => {
    const { app, repository } = createApp({
      databasePath: ":memory:",
      openAiApiKey: "",
      openAiModel: "gpt-4.1-mini"
    });
    const project = repository.createProject({
      type: "image_text",
      title: "AI 图文工作流",
      contentPillar: "AI workflow",
      platforms: ["小红书"],
      targetAudience: "Independent creators",
      promise: "Create a reusable carousel workflow",
      goal: "Publish one carousel"
    });

    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not start on a port");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/projects/${project.id}/studio`
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      project: expect.objectContaining({ id: project.id }),
      stages: expect.any(Array),
      currentStage: expect.any(Object),
      references: expect.any(Array),
      acceptedArtifacts: expect.any(Array),
      draftArtifacts: expect.any(Array),
      availableAiActions: expect.any(Array),
      relatedAiJobs: expect.any(Array)
    });

    server.close();
    repository.close();
  });

  it("creates project-scoped references through HTTP handlers", async () => {
    const { app, repository } = createApp({
      databasePath: ":memory:",
      openAiApiKey: "",
      openAiModel: "gpt-4.1-mini"
    });
    const project = repository.createProject({
      type: "video",
      title: "AI 视频脚本",
      contentPillar: "AI workflow",
      platforms: ["抖音"],
      targetAudience: "Independent creators",
      promise: "Create a repeatable video workflow",
      goal: "Publish one video"
    });

    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not start on a port");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;
    const createResponse = await fetch(
      `${baseUrl}/api/projects/${project.id}/references`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "transcript",
          contentType: "video",
          platform: "抖音",
          url: "https://example.com/video",
          title: "对标转写稿",
          notes: "开头三秒提出问题",
          transcript: "开头三秒提出问题，然后给出承诺。"
        })
      }
    );
    const listResponse = await fetch(
      `${baseUrl}/api/projects/${project.id}/references`
    );
    const missingResponse = await fetch(
      `${baseUrl}/api/projects/project_missing/references`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "url",
          contentType: "image_text",
          platform: "小红书",
          url: "",
          title: "对标图文",
          notes: "结构参考"
        })
      }
    );

    expect(createResponse.status).toBe(201);
    await expect(createResponse.json()).resolves.toMatchObject({
      projectId: project.id,
      title: "对标转写稿",
      transcript: "开头三秒提出问题，然后给出承诺。"
    });
    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ projectId: project.id, title: "对标转写稿" })
      ])
    );
    expect(missingResponse.status).toBe(404);
    await expect(missingResponse.json()).resolves.toEqual({ error: "项目不存在" });

    server.close();
    repository.close();
  });

  it("returns 404 for missing project studios", async () => {
    const { app, repository } = createApp({
      databasePath: ":memory:",
      openAiApiKey: "",
      openAiModel: "gpt-4.1-mini"
    });

    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not start on a port");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/projects/project_missing/studio`
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "项目不存在" });

    server.close();
    repository.close();
  });

  it("creates, lists, accepts, and rejects AI jobs", async () => {
    const { app, repository } = createApp({
      databasePath: ":memory:",
      openAiApiKey: "",
      openAiModel: "gpt-4.1-mini"
    });
    const project = repository.createProject({
      type: "image_text",
      title: "AI 图文工作流",
      contentPillar: "AI workflow",
      platforms: ["小红书"],
      targetAudience: "Independent creators",
      promise: "Create a reusable carousel workflow",
      goal: "Publish one carousel"
    });

    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not start on a port");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;
    const firstJobResponse = await fetch(`${baseUrl}/api/ai/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionId: "generate_image_plan",
        projectId: project.id,
        stage: "image_plan"
      })
    });
    const firstJob = (await firstJobResponse.json()) as { id: string; status: string };
    const jobsResponse = await fetch(`${baseUrl}/api/ai/jobs`);
    const acceptedResponse = await fetch(
      `${baseUrl}/api/ai/jobs/${firstJob.id}/accept`,
      { method: "POST" }
    );
    const secondJobResponse = await fetch(`${baseUrl}/api/ai/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionId: "generate_image_plan",
        projectId: project.id,
        stage: "image_plan"
      })
    });
    const secondJob = (await secondJobResponse.json()) as {
      id: string;
      status: string;
    };
    const rejectedResponse = await fetch(
      `${baseUrl}/api/ai/jobs/${secondJob.id}/reject`,
      { method: "POST" }
    );
    const missingAcceptResponse = await fetch(
      `${baseUrl}/api/ai/jobs/ai_job_missing/accept`,
      { method: "POST" }
    );

    expect(firstJobResponse.status).toBe(201);
    expect(firstJob.status).toBe("awaiting_review");
    expect(jobsResponse.status).toBe(200);
    await expect(jobsResponse.json()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: firstJob.id })])
    );
    expect(acceptedResponse.status).toBe(200);
    await expect(acceptedResponse.json()).resolves.toMatchObject({
      id: firstJob.id,
      status: "accepted"
    });
    expect(secondJobResponse.status).toBe(201);
    expect(secondJob.status).toBe("awaiting_review");
    expect(rejectedResponse.status).toBe(200);
    await expect(rejectedResponse.json()).resolves.toMatchObject({
      id: secondJob.id,
      status: "rejected"
    });
    expect(missingAcceptResponse.status).toBe(404);
    await expect(missingAcceptResponse.json()).resolves.toEqual({
      error: "AI 任务不存在"
    });

    server.close();
    repository.close();
  });
});
