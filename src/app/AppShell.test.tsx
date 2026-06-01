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
      cards: []
    },
    {
      status: "reference",
      title: "对标/素材",
      cards: []
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

  it("switches between shell navigation views", async () => {
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
    expect(screen.getByText("素材库即将接入")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "发布日历" }));
    expect(
      screen.getByRole("heading", { name: "发布日历" })
    ).toBeInTheDocument();
    expect(screen.getByText("发布日历即将接入")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "复盘库" }));
    expect(screen.getByRole("heading", { name: "复盘库" })).toBeInTheDocument();
    expect(screen.getByText("复盘库即将接入")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "设置" }));
    expect(screen.getByRole("heading", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByText("设置即将接入")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "工作台" }));
    expect(screen.getByText("项目总数")).toBeInTheDocument();
  });
});
