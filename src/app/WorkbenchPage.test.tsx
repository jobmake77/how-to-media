import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkbenchPage } from "./WorkbenchPage";
import type { WorkbenchState } from "../types";

const mockWorkbench: WorkbenchState = {
  summary: {
    totalProjects: 2,
    blockedProjects: 0,
    awaitingReview: 0,
    readyThisWeek: 0,
    aiRunning: 1
  },
  columns: [
    {
      status: "idea",
      title: "选题池",
      cards: [
        {
          id: "project_image",
          type: "image_text",
          title: "AI 图文选题",
          platforms: ["小红书"],
          contentPillar: "AI 工作流",
          workflowStatus: "idea",
          currentStage: "topic",
          nextAction: "补充对标素材",
          blockedReason: "",
          priority: "normal",
          publishAt: "",
          referenceCount: 1,
          artifactCount: 0,
          aiState: "actionable"
        }
      ]
    },
    {
      status: "reference",
      title: "对标/素材",
      cards: [
        {
          id: "project_video",
          type: "video",
          title: "AI 视频脚本",
          platforms: ["抖音"],
          contentPillar: "AI 视频",
          workflowStatus: "reference",
          currentStage: "reference_videos",
          nextAction: "补充对标视频或转写稿",
          blockedReason: "",
          priority: "high",
          publishAt: "",
          referenceCount: 2,
          artifactCount: 1,
          aiState: "running"
        }
      ]
    },
    { status: "draft", title: "草稿/脚本", cards: [] },
    { status: "production", title: "制作/剪辑", cards: [] },
    { status: "ready", title: "待发布", cards: [] },
    { status: "published", title: "已发布", cards: [] },
    { status: "reviewed", title: "已复盘", cards: [] }
  ],
  aiQueue: {
    running: [],
    awaitingReview: [],
    failed: [],
    availableActions: []
  }
};

describe("WorkbenchPage", () => {
  it("renders pipeline columns, project cards, and create entry", () => {
    render(<WorkbenchPage workbench={mockWorkbench} />);

    expect(screen.getByText("选题池")).toBeInTheDocument();
    expect(screen.getByText("对标/素材")).toBeInTheDocument();
    expect(screen.getByText("草稿/脚本")).toBeInTheDocument();
    expect(screen.getByText("制作/剪辑")).toBeInTheDocument();
    expect(screen.getByText("待发布")).toBeInTheDocument();
    expect(screen.getByText("AI 图文选题")).toBeInTheDocument();
    expect(screen.getByText("补充对标素材")).toBeInTheDocument();
    expect(screen.getByText("AI 视频脚本")).toBeInTheDocument();
    expect(screen.getByText("素材 1")).toBeInTheDocument();
    expect(screen.getByText("产物 1")).toBeInTheDocument();
    expect(screen.getByText("创建项目")).toBeInTheDocument();
  });

  it("opens a project from a card", () => {
    const onOpenProject = vi.fn();

    render(
      <WorkbenchPage
        onOpenProject={onOpenProject}
        workbench={mockWorkbench}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /AI 图文选题/ }));

    expect(onOpenProject).toHaveBeenCalledWith("project_image");
  });
});
