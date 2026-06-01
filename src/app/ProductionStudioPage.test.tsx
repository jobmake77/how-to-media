import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductionStudioPage } from "./ProductionStudioPage";
import type { StudioState } from "../types";

const baseProject = {
  id: "project_image",
  type: "image_text" as const,
  title: "AI 图文选题",
  contentPillar: "AI 工作流",
  platforms: ["小红书"],
  workflowStatus: "draft" as const,
  currentStage: "topic",
  nextAction: "补充对标素材",
  blockedReason: "",
  priority: "normal" as const,
  targetAudience: "个人创作者",
  promise: "用一套流程稳定产出图文",
  goal: "进入生产流水线",
  publishAt: "",
  createdAt: "2026-05-31T00:00:00.000Z",
  updatedAt: "2026-05-31T00:00:00.000Z"
};

const imageStudio: StudioState = {
  project: baseProject,
  stages: [
    { id: "topic", label: "选题定义", description: "明确受众和承诺" },
    { id: "references", label: "对标素材", description: "整理对标" },
    { id: "diagnosis", label: "AI 诊断", description: "沉淀结构" },
    { id: "title_cover", label: "标题与封面", description: "规划封面" },
    { id: "image_plan", label: "图片页规划", description: "规划图片页" },
    { id: "body_caption", label: "正文与发布文案", description: "整理正文" },
    { id: "publish_pack", label: "发布包", description: "准备发布" },
    { id: "retrospective", label: "复盘", description: "记录复盘" }
  ],
  currentStage: { id: "topic", label: "选题定义", description: "明确受众和承诺" },
  references: [
    {
      id: "reference_1",
      projectId: "project_image",
      sourceType: "url",
      contentType: "image_text",
      platform: "小红书",
      url: "https://example.com/post",
      title: "对标图文",
      author: "",
      rawText: "",
      transcript: "",
      screenshots: [],
      metrics: {},
      notes: "结构值得参考",
      status: "collected",
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z"
    }
  ],
  acceptedArtifacts: [
    {
      id: "artifact_accepted",
      projectId: "project_image",
      type: "diagnosis",
      stage: "diagnosis",
      title: "诊断结论",
      content: "结构清晰",
      structuredData: {},
      source: "ai",
      version: 1,
      status: "accepted",
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z"
    }
  ],
  draftArtifacts: [
    {
      id: "artifact_draft",
      projectId: "project_image",
      type: "image_plan",
      stage: "image_plan",
      title: "图片规划草稿",
      content: "第 1 页封面",
      structuredData: {},
      source: "ai",
      version: 1,
      status: "draft",
      createdAt: "2026-05-31T00:00:00.000Z",
      updatedAt: "2026-05-31T00:00:00.000Z"
    }
  ],
  availableAiActions: [
    {
      id: "generate_image_plan",
      label: "生成图片页规划",
      stage: "image_plan"
    }
  ],
  relatedAiJobs: []
};

const videoStudio: StudioState = {
  ...imageStudio,
  project: {
    ...baseProject,
    id: "project_video",
    type: "video",
    title: "AI 视频脚本",
    currentStage: "script"
  },
  stages: [
    { id: "topic", label: "选题定义", description: "明确受众和承诺" },
    { id: "reference_videos", label: "对标视频", description: "整理对标视频" },
    { id: "asr_transcript", label: "ASR 转写", description: "整理转写稿" },
    { id: "diagnosis", label: "AI 诊断", description: "分析结构" },
    { id: "script", label: "口播稿", description: "产出口播稿" },
    { id: "recording_plan", label: "录制计划", description: "准备录制" },
    { id: "edit_plan", label: "剪辑计划", description: "规划剪辑" },
    { id: "publish_pack", label: "发布包", description: "准备发布" },
    { id: "retrospective", label: "复盘", description: "记录复盘" }
  ],
  currentStage: { id: "script", label: "口播稿", description: "产出口播稿" },
  references: [],
  acceptedArtifacts: [],
  draftArtifacts: [],
  availableAiActions: []
};

describe("ProductionStudioPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders image-text studio stages and current stage inputs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(imageStudio), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        )
      )
    );

    render(<ProductionStudioPage projectId="project_image" />);

    expect(await screen.findByText("选题定义")).toBeInTheDocument();
    expect(screen.getByText("标题与封面")).toBeInTheDocument();
    expect(screen.getByText("图片页规划")).toBeInTheDocument();
    expect(screen.getByText("AI 图文选题")).toBeInTheDocument();
    expect(screen.getByText("输入素材")).toBeInTheDocument();
    expect(screen.getByText("对标图文")).toBeInTheDocument();
    expect(screen.getByText("已确认产物")).toBeInTheDocument();
    expect(screen.getByText("诊断结论")).toBeInTheDocument();
    expect(screen.getByLabelText("人工备注")).toBeInTheDocument();
  });

  it("renders video studio stages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(videoStudio), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        )
      )
    );

    render(<ProductionStudioPage projectId="project_video" />);

    expect(await screen.findByText("对标视频")).toBeInTheDocument();
    expect(screen.getByText("ASR 转写")).toBeInTheDocument();
    expect(screen.getByText("口播稿")).toBeInTheDocument();
    expect(screen.getByText("剪辑计划")).toBeInTheDocument();
    expect(screen.getByText("AI 视频脚本")).toBeInTheDocument();
  });

  it("creates an AI job from the selected stage action", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/api/projects/project_image/studio")) {
        return Promise.resolve(
          new Response(JSON.stringify(imageStudio), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      if (url.endsWith("/api/ai/jobs") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "ai_job_1",
              projectId: "project_image",
              stage: "image_plan",
              action: "generate_image_plan",
              scope: "project",
              status: "awaiting_review",
              inputSnapshot: {},
              output: {},
              outputArtifactId: "artifact_1",
              acceptedTarget: "artifact",
              error: "",
              createdAt: "2026-05-31T00:00:00.000Z",
              updatedAt: "2026-05-31T00:00:00.000Z"
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProductionStudioPage projectId="project_image" />);

    fireEvent.click(await screen.findByText("图片页规划"));
    fireEvent.click(await screen.findByText("生成图片页规划"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/ai/jobs",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            actionId: "generate_image_plan",
            projectId: "project_image",
            stage: "image_plan"
          })
        })
      );
    });
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith("/api/projects/project_image/studio")
      )
    ).toHaveLength(2);
  });

  it("creates an image-text reference from the studio", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/api/projects/project_image/studio")) {
        return Promise.resolve(
          new Response(JSON.stringify({ ...imageStudio, references: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      if (
        url.endsWith("/api/projects/project_image/references") &&
        init?.method === "POST"
      ) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "reference_new",
              projectId: "project_image",
              sourceType: "url",
              contentType: "image_text",
              platform: "小红书",
              url: "https://example.com/post",
              title: "新增图文素材",
              author: "",
              rawText: "正文结构参考",
              transcript: "",
              screenshots: [],
              metrics: {},
              notes: "正文结构参考",
              status: "collected",
              createdAt: "2026-05-31T00:00:00.000Z",
              updatedAt: "2026-05-31T00:00:00.000Z"
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProductionStudioPage projectId="project_image" />);

    expect(await screen.findByText("添加图文素材")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("素材标题"), {
      target: { value: "新增图文素材" }
    });
    fireEvent.change(screen.getByLabelText("素材平台"), {
      target: { value: "小红书" }
    });
    fireEvent.change(screen.getByLabelText("素材链接"), {
      target: { value: "https://example.com/post" }
    });
    fireEvent.change(screen.getByLabelText("素材内容"), {
      target: { value: "正文结构参考" }
    });
    fireEvent.click(screen.getByText("添加图文素材"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/projects/project_image/references",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            sourceType: "url",
            contentType: "image_text",
            platform: "小红书",
            url: "https://example.com/post",
            title: "新增图文素材",
            notes: "正文结构参考",
            rawText: "正文结构参考"
          })
        })
      );
    });
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith("/api/projects/project_image/studio")
      )
    ).toHaveLength(2);
  });

  it("creates a video transcript reference from the studio", async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/api/projects/project_video/studio")) {
        return Promise.resolve(
          new Response(JSON.stringify(videoStudio), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      if (
        url.endsWith("/api/projects/project_video/references") &&
        init?.method === "POST"
      ) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: "reference_video",
              projectId: "project_video",
              sourceType: "transcript",
              contentType: "video",
              platform: "抖音",
              url: "https://example.com/video",
              title: "新增视频转写稿",
              author: "",
              rawText: "",
              transcript: "开头三秒提出问题，然后给出承诺。",
              screenshots: [],
              metrics: {},
              notes: "开头三秒提出问题，然后给出承诺。",
              status: "collected",
              createdAt: "2026-05-31T00:00:00.000Z",
              updatedAt: "2026-05-31T00:00:00.000Z"
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ProductionStudioPage projectId="project_video" />);

    expect(await screen.findByText("添加视频转写稿")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("素材标题"), {
      target: { value: "新增视频转写稿" }
    });
    fireEvent.change(screen.getByLabelText("素材平台"), {
      target: { value: "抖音" }
    });
    fireEvent.change(screen.getByLabelText("素材链接"), {
      target: { value: "https://example.com/video" }
    });
    fireEvent.change(screen.getByLabelText("转写稿内容"), {
      target: { value: "开头三秒提出问题，然后给出承诺。" }
    });
    fireEvent.click(screen.getByText("添加视频转写稿"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/projects/project_video/references",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            sourceType: "transcript",
            contentType: "video",
            platform: "抖音",
            url: "https://example.com/video",
            title: "新增视频转写稿",
            notes: "开头三秒提出问题，然后给出承诺。",
            transcript: "开头三秒提出问题，然后给出承诺。"
          })
        })
      );
    });
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith("/api/projects/project_video/studio")
      )
    ).toHaveLength(2);
  });
});
