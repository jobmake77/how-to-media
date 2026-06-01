import { useEffect, useState } from "react";
import { api } from "../api";
import { AiQueuePanel } from "../features/ai/AiQueuePanel";
import type { WorkbenchState } from "../types";
import { ProductionStudioPage } from "./ProductionStudioPage";
import { WorkbenchPage } from "./WorkbenchPage";

type ActiveView =
  | { name: "workbench" }
  | { name: "studio"; projectId: string };

const navigationItems = ["工作台", "素材库", "发布日历", "复盘库", "设置"];

export function AppShell() {
  const [activeView, setActiveView] = useState<ActiveView>({ name: "workbench" });
  const [workbench, setWorkbench] = useState<WorkbenchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reloadWorkbench = () => {
    let mounted = true;
    setLoading(true);
    setError("");

    api
      .getWorkbench()
      .then((state) => {
        if (mounted) {
          setWorkbench(state);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("工作台加载失败");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  };

  useEffect(() => {
    return reloadWorkbench();
  }, []);

  return (
    <main className="app-workbench-shell">
      <aside className="app-nav" aria-label="主导航">
        <div className="app-brand">How To Media</div>
        <nav>
          {navigationItems.map((item) => (
            <button
              className={item === "工作台" ? "active" : ""}
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <section className="app-main">
        {activeView.name === "workbench" ? (
          <WorkbenchContent
            error={error}
            loading={loading}
            onOpenProject={(projectId) =>
              setActiveView({ name: "studio", projectId })
            }
            onRefresh={reloadWorkbench}
            workbench={workbench}
          />
        ) : (
          <ProductionStudioPage
            onBack={() => setActiveView({ name: "workbench" })}
            onRefreshWorkbench={reloadWorkbench}
            projectId={activeView.projectId}
          />
        )}
      </section>

      {workbench ? (
        <AiQueuePanel
          onAcceptJob={async (jobId) => {
            await api.acceptAiJob(jobId);
            reloadWorkbench();
          }}
          onRejectJob={async (jobId) => {
            await api.rejectAiJob(jobId);
            reloadWorkbench();
          }}
          queue={workbench.aiQueue}
        />
      ) : (
        <aside className="app-ai-panel" aria-label="AI 队列">
          <h2>AI 队列</h2>
          <p>{loading ? "正在加载工作台..." : "暂无队列数据"}</p>
        </aside>
      )}
    </main>
  );
}

function WorkbenchContent({
  error,
  loading,
  onOpenProject,
  onRefresh,
  workbench
}: {
  error: string;
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  onRefresh: () => (() => void) | void;
  workbench: WorkbenchState | null;
}) {
  if (loading) {
    return <p>正在加载工作台...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!workbench) {
    return <p>暂无工作台数据</p>;
  }

  return (
    <WorkbenchPage
      onOpenProject={onOpenProject}
      onRefresh={onRefresh}
      workbench={workbench}
    />
  );
}
