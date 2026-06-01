import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import type { WorkbenchState } from "../types";

const workbenchState: WorkbenchState = {
  summary: {
    totalProjects: 2,
    blockedProjects: 0,
    awaitingReview: 1,
    readyThisWeek: 0,
    aiRunning: 0
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
          publishAt: "2026-06-05T09:00:00.000Z",
          referenceCount: 1,
          artifactCount: 2,
          aiState: "actionable"
        }
      ]
    },
    {
      status: "reference",
      title: "对标/素材",
      cards: []
    },
    {
      status: "ready",
      title: "待发布",
      cards: [
        {
          id: "project_ready",
          type: "video",
          title: "AI 视频脚本",
          platforms: ["抖音"],
          contentPillar: "AI 视频",
          workflowStatus: "ready",
          currentStage: "publish_pack",
          nextAction: "检查发布包",
          blockedReason: "",
          priority: "high",
          publishAt: "2026-06-06T12:00:00.000Z",
          referenceCount: 2,
          artifactCount: 3,
          aiState: "awaiting_review"
        }
      ]
    },
    {
      status: "reviewed",
      title: "已复盘",
      cards: [
        {
          id: "project_reviewed",
          type: "image_text",
          title: "AI 复盘案例",
          platforms: ["公众号"],
          contentPillar: "复盘",
          workflowStatus: "reviewed",
          currentStage: "retrospective",
          nextAction: "沉淀下一批选题",
          blockedReason: "",
          priority: "normal",
          publishAt: "2026-06-01T12:00:00.000Z",
          referenceCount: 0,
          artifactCount: 4,
          aiState: "idle"
        }
      ]
    }
  ],
  aiQueue: {
    running: [],
    awaitingReview: [],
    failed: [],
    availableActions: []
  }
};

describe("AppShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the navigation, workbench placeholder, and AI queue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/api/workbench")) {
          return Promise.resolve(
            new Response(JSON.stringify(workbenchState), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return Promise.resolve(new Response(null, { status: 404 }));
      })
    );

    render(<AppShell />);

    expect(await screen.findByText("工作台")).toBeInTheDocument();
    expect(screen.getByText("素材库")).toBeInTheDocument();
    expect(screen.getByText("发布日历")).toBeInTheDocument();
    expect(screen.getByText("复盘库")).toBeInTheDocument();
    expect(screen.getByText("AI 队列")).toBeInTheDocument();
    expect(screen.getByText("项目总数")).toBeInTheDocument();
    expect(screen.getByText("选题池")).toBeInTheDocument();
  });

  it("switches between shell navigation views with useful content", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/api/workbench")) {
          return Promise.resolve(
            new Response(JSON.stringify(workbenchState), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return Promise.resolve(new Response(null, { status: 404 }));
      })
    );

    render(<AppShell />);

    await screen.findByRole("heading", { name: "工作台" });

    await user.click(screen.getByRole("button", { name: "素材库" }));
    expect(screen.getByRole("heading", { name: "素材库" })).toBeInTheDocument();
    expect(screen.getByText("素材覆盖项目")).toBeInTheDocument();
    expect(screen.getByText("AI 图文选题")).toBeInTheDocument();
    expect(screen.getByText(/素材 1/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "发布日历" }));
    expect(
      screen.getByRole("heading", { name: "发布日历" })
    ).toBeInTheDocument();
    expect(screen.getByText("即将发布")).toBeInTheDocument();
    expect(screen.getByText("AI 视频脚本")).toBeInTheDocument();
    expect(screen.getByText(/2026-06-06/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "复盘库" }));
    expect(screen.getByRole("heading", { name: "复盘库" })).toBeInTheDocument();
    expect(screen.getByText("AI 复盘案例")).toBeInTheDocument();
    expect(screen.getByText("已复盘项目")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "设置" }));
    expect(screen.getByRole("heading", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByText("系统状态")).toBeInTheDocument();
    expect(screen.getByText("/api/workbench")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "工作台" }));
    expect(screen.getByText("项目总数")).toBeInTheDocument();
  });
});
