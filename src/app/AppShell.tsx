import { useEffect, useState } from "react";
import { api } from "../api";
import { AiQueuePanel } from "../features/ai/AiQueuePanel";
import type { WorkbenchState } from "../types";
import {
  MaterialLibraryPage,
  PublishCalendarPage,
  RetrospectiveLibraryPage,
  SettingsPage
} from "./NavigationPages";
import { ProductionStudioPage } from "./ProductionStudioPage";
import { WorkbenchPage } from "./WorkbenchPage";

type ActiveView =
  | { name: "workbench" }
  | { name: "library" }
  | { name: "calendar" }
  | { name: "retrospectives" }
  | { name: "settings" }
  | { name: "studio"; projectId: string };

type NavigationView = Exclude<ActiveView["name"], "studio">;

const navigationItems: Array<{ label: string; view: NavigationView }> = [
  { label: "工作台", view: "workbench" },
  { label: "素材库", view: "library" },
  { label: "发布日历", view: "calendar" },
  { label: "复盘库", view: "retrospectives" },
  { label: "设置", view: "settings" }
];

function createNavigationView(view: NavigationView): ActiveView {
  switch (view) {
    case "workbench":
      return { name: "workbench" };
    case "library":
      return { name: "library" };
    case "calendar":
      return { name: "calendar" };
    case "retrospectives":
      return { name: "retrospectives" };
    case "settings":
      return { name: "settings" };
  }
}

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
              className={activeView.name === item.view ? "active" : ""}
              key={item.view}
              onClick={() => setActiveView(createNavigationView(item.view))}
              type="button"
            >
              {item.label}
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
        ) : activeView.name === "studio" ? (
          <ProductionStudioPage
            onBack={() => setActiveView({ name: "workbench" })}
            onRefreshWorkbench={reloadWorkbench}
            projectId={activeView.projectId}
          />
        ) : (
          <SecondaryContent
            activeView={activeView.name}
            error={error}
            loading={loading}
            onOpenProject={(projectId) =>
              setActiveView({ name: "studio", projectId })
            }
            workbench={workbench}
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

function SecondaryContent({
  activeView,
  error,
  loading,
  onOpenProject,
  workbench
}: {
  activeView: Exclude<NavigationView, "workbench">;
  error: string;
  loading: boolean;
  onOpenProject: (projectId: string) => void;
  workbench: WorkbenchState | null;
}) {
  switch (activeView) {
    case "library":
      return (
        <MaterialLibraryPage
          error={error}
          loading={loading}
          onOpenProject={onOpenProject}
          workbench={workbench}
        />
      );
    case "calendar":
      return (
        <PublishCalendarPage
          error={error}
          loading={loading}
          onOpenProject={onOpenProject}
          workbench={workbench}
        />
      );
    case "retrospectives":
      return (
        <RetrospectiveLibraryPage
          error={error}
          loading={loading}
          onOpenProject={onOpenProject}
          workbench={workbench}
        />
      );
    case "settings":
      return (
        <SettingsPage
          error={error}
          loading={loading}
          workbench={workbench}
        />
      );
  }
}
