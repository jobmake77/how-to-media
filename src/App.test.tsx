import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders Chinese image-text and video workflow entry points", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/api/templates")) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: "template_image_text",
                  type: "image_text",
                  name: "AI 原生图文工作流",
                  stages: ["对标研究", "图片规划"],
                  checklist: [],
                  assetDefaults: []
                },
                {
                  id: "template_video",
                  type: "video",
                  name: "AI 原生视频工作流",
                  stages: ["ASR 转写", "最终剪辑"],
                  checklist: [],
                  assetDefaults: []
                }
              ]),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
        }

        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          })
        );
      })
    );

    render(<App />);

    expect(
      await screen.findAllByText("AI 原生图文工作流")
    ).not.toHaveLength(0);
    expect(await screen.findAllByText("AI 原生视频工作流")).not.toHaveLength(
      0
    );
    expect(screen.getByText("新建图文项目")).toBeInTheDocument();
    expect(screen.getByText("新建视频项目")).toBeInTheDocument();
  });
});
