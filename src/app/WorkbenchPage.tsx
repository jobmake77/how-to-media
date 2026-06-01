import type { WorkbenchState } from "../types";
import { ProjectCreateDialog } from "../features/projects/ProjectCreateDialog";
import { ProjectPipeline } from "../features/projects/ProjectPipeline";

export interface WorkbenchPageProps {
  workbench: WorkbenchState;
  onRefresh?: () => void;
  onOpenProject?: (projectId: string) => void;
}

export function WorkbenchPage({
  workbench,
  onRefresh,
  onOpenProject
}: WorkbenchPageProps) {
  const metrics = [
    { label: "项目总数", value: workbench.summary.totalProjects },
    { label: "阻塞项目", value: workbench.summary.blockedProjects },
    { label: "待审核", value: workbench.summary.awaitingReview },
    { label: "本周待发布", value: workbench.summary.readyThisWeek },
    { label: "AI 运行中", value: workbench.summary.aiRunning }
  ];

  return (
    <div className="workbench-page">
      <header className="workbench-header">
        <div>
          <p className="eyebrow">AI Native Workbench</p>
          <h1>工作台</h1>
        </div>
      </header>

      <section className="summary-strip" aria-label="工作台概览">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </section>

      <div className="workbench-layout">
        <ProjectPipeline
          columns={workbench.columns}
          onOpenProject={onOpenProject}
        />
        <ProjectCreateDialog onCreated={onRefresh} />
      </div>
    </div>
  );
}
