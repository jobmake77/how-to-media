import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiQueuePanel } from "./AiQueuePanel";
import type { AiQueueState } from "../../types";

const queue: AiQueueState = {
  running: [
    {
      id: "job_running",
      projectId: "project_1",
      action: "生成图片页规划",
      status: "running"
    }
  ],
  awaitingReview: [
    {
      id: "job_review",
      projectId: "project_1",
      action: "生成发布包",
      status: "awaiting_review",
      outputArtifactId: "artifact_1"
    }
  ],
  failed: [
    {
      id: "job_failed",
      projectId: "project_2",
      action: "诊断对标视频",
      error: "需要至少一条视频转写稿 reference"
    }
  ],
  availableActions: [
    {
      id: "generate_image_plan",
      label: "生成图片页规划"
    }
  ]
};

describe("AiQueuePanel", () => {
  it("renders queue sections, jobs, errors, and actions", () => {
    render(<AiQueuePanel queue={queue} />);

    expect(screen.getByText("正在运行")).toBeInTheDocument();
    expect(screen.getByText("等待确认")).toBeInTheDocument();
    expect(screen.getByText("失败任务")).toBeInTheDocument();
    expect(screen.getByText("可执行动作")).toBeInTheDocument();
    expect(screen.getAllByText("生成图片页规划")).not.toHaveLength(0);
    expect(screen.getByText("生成发布包")).toBeInTheDocument();
    expect(screen.getByText("诊断对标视频")).toBeInTheDocument();
    expect(
      screen.getByText("需要至少一条视频转写稿 reference")
    ).toBeInTheDocument();
    expect(screen.getByText("接受")).toBeInTheDocument();
    expect(screen.getByText("废弃")).toBeInTheDocument();
  });

  it("calls accept and reject callbacks for review jobs", () => {
    const onAcceptJob = vi.fn();
    const onRejectJob = vi.fn();

    render(
      <AiQueuePanel
        onAcceptJob={onAcceptJob}
        onRejectJob={onRejectJob}
        queue={queue}
      />
    );

    fireEvent.click(screen.getByText("接受"));
    fireEvent.click(screen.getByText("废弃"));

    expect(onAcceptJob).toHaveBeenCalledWith("job_review");
    expect(onRejectJob).toHaveBeenCalledWith("job_review");
  });
});
