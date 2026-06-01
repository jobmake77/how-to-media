import { useEffect, useState } from "react";
import { api } from "../api";
import { AiQueuePanel } from "../features/ai/AiQueuePanel";
import type { WorkbenchState } from "../types";
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

const placeholderViews: Record<
  Exclude<NavigationView, "workbench">,
  {
    title: string;
    description: string;
  }
> = {
  library: {
    title: "素材库",
    description: "素材库即将接入"
  },
  calendar: {
    title: "发布日历",
    description: "发布日历即将接入"
  },
  retrospectives: {
    title: "复盘库",
    description: "复盘库即将接入"
  },
  settings: {
    title: "设置",
    description: "设置即将接入"
  }
};

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
          <PlaceholderView view={activeView.name} />
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

function PlaceholderView({
  view
}: {
  view: Exclude<NavigationView, "workbench">;
}) {
  const content = placeholderViews[view];

  return (
    <section className="shell-placeholder-view">
      <p className="eyebrow">Coming Soon</p>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
    </section>
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
