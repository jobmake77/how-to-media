import { render, screen } from "@testing-library/react";
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
});
