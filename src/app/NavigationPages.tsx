import type { WorkbenchCard, WorkbenchState, WorkflowStatus } from "../types";

export type SecondaryView = "library" | "calendar" | "retrospectives" | "settings";

export interface NavigationPageProps {
  workbench: WorkbenchState | null;
  loading: boolean;
  error: string;
  onOpenProject: (projectId: string) => void;
}

const statusLabels: Record<WorkflowStatus, string> = {
  idea: "选题池",
  reference: "对标/素材",
  draft: "草稿/脚本",
  production: "制作/剪辑",
  ready: "待发布",
  published: "已发布",
  reviewed: "已复盘"
};

function allCards(workbench: WorkbenchState | null) {
  return workbench?.columns.flatMap((column) => column.cards) ?? [];
}

function formatDate(value: string) {
  if (!value) {
    return "未设定";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function PageFrame({
  children,
  description,
  eyebrow,
  title
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="secondary-page">
      <header className="secondary-page-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}

function DataState({
  error,
  loading,
  workbench
}: {
  error: string;
  loading: boolean;
  workbench: WorkbenchState | null;
}) {
  if (loading) {
    return <p className="secondary-empty">正在加载数据...</p>;
  }

  if (error) {
    return <p className="secondary-empty" role="alert">{error}</p>;
  }

  if (!workbench) {
    return <p className="secondary-empty">暂无数据</p>;
  }

  return null;
}

function ProjectRow({
  card,
  detail,
  onOpenProject
}: {
  card: WorkbenchCard;
  detail: string;
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <button
      className="secondary-row"
      onClick={() => onOpenProject(card.id)}
      type="button"
    >
      <div>
        <strong>{card.title}</strong>
        <span>{card.platforms.join("、") || "未设定平台"}</span>
      </div>
      <div>
        <span>{detail}</span>
        <span>{card.nextAction || "暂无下一步"}</span>
      </div>
    </button>
  );
}

export function MaterialLibraryPage({
  error,
  loading,
  onOpenProject,
  workbench
}: NavigationPageProps) {
  const cards = allCards(workbench);
  const projectsWithReferences = cards.filter((card) => card.referenceCount > 0);

  return (
    <PageFrame
      description="集中查看每个生产项目的素材覆盖、产物数量和下一步补齐动作。"
      eyebrow="Reference Library"
      title="素材库"
    >
      <DataState error={error} loading={loading} workbench={workbench} />
      {workbench ? (
        <>
          <section className="secondary-summary-grid" aria-label="素材库概览">
            <div>
              <span>素材覆盖项目</span>
              <strong>{projectsWithReferences.length}</strong>
            </div>
            <div>
              <span>素材总数</span>
              <strong>
                {cards.reduce((total, card) => total + card.referenceCount, 0)}
              </strong>
            </div>
            <div>
              <span>待补素材</span>
              <strong>{cards.filter((card) => card.referenceCount === 0).length}</strong>
            </div>
          </section>

          <section className="secondary-list" aria-label="素材项目列表">
            {cards.length ? (
              cards.map((card) => (
                <ProjectRow
                  card={card}
                  detail={`素材 ${card.referenceCount} · 产物 ${card.artifactCount}`}
                  key={card.id}
                  onOpenProject={onOpenProject}
                />
              ))
            ) : (
              <p className="secondary-empty">暂无素材项目</p>
            )}
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}

export function PublishCalendarPage({
  error,
  loading,
  onOpenProject,
  workbench
}: NavigationPageProps) {
  const publishCards = allCards(workbench)
    .filter((card) => ["ready", "published"].includes(card.workflowStatus))
    .sort((a, b) => (a.publishAt || "").localeCompare(b.publishAt || ""));

  return (
    <PageFrame
      description="按发布时间查看待发布和已发布内容，避免发布包准备完成后失去节奏。"
      eyebrow="Publish Calendar"
      title="发布日历"
    >
      <DataState error={error} loading={loading} workbench={workbench} />
      {workbench ? (
        <>
          <section className="secondary-summary-grid" aria-label="发布日历概览">
            <div>
              <span>即将发布</span>
              <strong>
                {publishCards.filter((card) => card.workflowStatus === "ready").length}
              </strong>
            </div>
            <div>
              <span>已发布</span>
              <strong>
                {publishCards.filter((card) => card.workflowStatus === "published").length}
              </strong>
            </div>
            <div>
              <span>待审核</span>
              <strong>{workbench.summary.awaitingReview}</strong>
            </div>
          </section>

          <section className="secondary-list" aria-label="发布计划列表">
            {publishCards.length ? (
              publishCards.map((card) => (
                <ProjectRow
                  card={card}
                  detail={`${formatDate(card.publishAt)} · ${statusLabels[card.workflowStatus]}`}
                  key={card.id}
                  onOpenProject={onOpenProject}
                />
              ))
            ) : (
              <p className="secondary-empty">暂无发布计划</p>
            )}
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}

export function RetrospectiveLibraryPage({
  error,
  loading,
  onOpenProject,
  workbench
}: NavigationPageProps) {
  const reviewedCards = allCards(workbench).filter(
    (card) => card.workflowStatus === "reviewed"
  );

  return (
    <PageFrame
      description="汇总已经复盘的内容项目，沉淀下一批选题、素材判断和生产经验。"
      eyebrow="Retrospectives"
      title="复盘库"
    >
      <DataState error={error} loading={loading} workbench={workbench} />
      {workbench ? (
        <>
          <section className="secondary-summary-grid" aria-label="复盘库概览">
            <div>
              <span>已复盘项目</span>
              <strong>{reviewedCards.length}</strong>
            </div>
            <div>
              <span>复盘产物</span>
              <strong>
                {reviewedCards.reduce((total, card) => total + card.artifactCount, 0)}
              </strong>
            </div>
            <div>
              <span>下一步动作</span>
              <strong>{reviewedCards.filter((card) => card.nextAction).length}</strong>
            </div>
          </section>

          <section className="secondary-list" aria-label="复盘项目列表">
            {reviewedCards.length ? (
              reviewedCards.map((card) => (
                <ProjectRow
                  card={card}
                  detail={`产物 ${card.artifactCount} · ${card.contentPillar}`}
                  key={card.id}
                  onOpenProject={onOpenProject}
                />
              ))
            ) : (
              <p className="secondary-empty">暂无复盘项目</p>
            )}
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}

export function SettingsPage({
  error,
  loading,
  workbench
}: Omit<NavigationPageProps, "onOpenProject">) {
  return (
    <PageFrame
      description="查看当前本地工作台的接口、AI 队列和运行状态。"
      eyebrow="Settings"
      title="设置"
    >
      <DataState error={error} loading={loading} workbench={workbench} />
      {workbench ? (
        <>
          <section className="secondary-summary-grid" aria-label="系统状态">
            <div>
              <span>系统状态</span>
              <strong>正常</strong>
            </div>
            <div>
              <span>AI 运行中</span>
              <strong>{workbench.summary.aiRunning}</strong>
            </div>
            <div>
              <span>待审核</span>
              <strong>{workbench.summary.awaitingReview}</strong>
            </div>
          </section>

          <section className="settings-endpoints" aria-label="接口状态">
            <h2>接口状态</h2>
            <ul>
              <li>/api/workbench</li>
              <li>/api/projects/:id/studio</li>
              <li>/api/ai/jobs</li>
              <li>/api/templates</li>
            </ul>
          </section>
        </>
      ) : null}
    </PageFrame>
  );
}
