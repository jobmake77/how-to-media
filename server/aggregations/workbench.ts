import type { ContentType, Priority, WorkflowStatus } from "../domain";
import type { createDatabase } from "../repository";

export interface WorkbenchState {
  summary: {
    totalProjects: number;
    blockedProjects: number;
    awaitingReview: number;
    readyThisWeek: number;
    aiRunning: number;
  };
  columns: Array<{
    status: WorkflowStatus;
    title: string;
    cards: WorkbenchCard[];
  }>;
  aiQueue: AiQueueState;
}

export interface WorkbenchCard {
  id: string;
  type: ContentType;
  title: string;
  platforms: string[];
  contentPillar: string;
  workflowStatus: WorkflowStatus;
  currentStage: string;
  nextAction: string;
  blockedReason: string;
  priority: Priority;
  publishAt: string;
  referenceCount: number;
  artifactCount: number;
  aiState: "idle" | "actionable" | "running" | "awaiting_review" | "failed";
}

export interface AiQueueState {
  running: Array<{
    id: string;
    projectId: string | null;
    action: string;
    status: string;
  }>;
  awaitingReview: Array<{
    id: string;
    projectId: string | null;
    action: string;
    status: string;
    outputArtifactId: string | null;
  }>;
  failed: Array<{
    id: string;
    projectId: string | null;
    action: string;
    error: string;
  }>;
  availableActions: Array<{
    id: string;
    label: string;
  }>;
}

const columns: Array<{ status: WorkflowStatus; title: string }> = [
  { status: "idea", title: "选题池" },
  { status: "reference", title: "对标/素材" },
  { status: "draft", title: "草稿/脚本" },
  { status: "production", title: "制作/剪辑" },
  { status: "ready", title: "待发布" },
  { status: "published", title: "已发布" },
  { status: "reviewed", title: "已复盘" }
];

const availableActions = [
  { id: "ideate", label: "生成选题" },
  { id: "diagnose_reference", label: "诊断对标" },
  { id: "draft", label: "生成草稿" },
  { id: "optimize", label: "优化内容" },
  { id: "publish_pack", label: "生成发布包" },
  { id: "retrospective", label: "生成复盘" }
];

export function buildWorkbenchState(
  repository: ReturnType<typeof createDatabase>
): WorkbenchState {
  const projects = repository.listProjects();
  const references = repository.listReferences();
  const aiJobs = repository.listAiJobs();
  const artifactCounts = new Map<string, number>();
  const referenceCounts = new Map<string, number>();
  const jobsByProject = new Map<string, typeof aiJobs>();

  for (const reference of references) {
    if (!reference.projectId) {
      continue;
    }
    referenceCounts.set(
      reference.projectId,
      (referenceCounts.get(reference.projectId) ?? 0) + 1
    );
  }

  for (const project of projects) {
    artifactCounts.set(project.id, repository.listArtifacts(project.id).length);
  }

  for (const job of aiJobs) {
    if (!job.projectId) {
      continue;
    }
    jobsByProject.set(job.projectId, [
      ...(jobsByProject.get(job.projectId) ?? []),
      job
    ]);
  }

  const cards: WorkbenchCard[] = projects.map((project) => {
    const projectJobs = jobsByProject.get(project.id) ?? [];
    return {
      id: project.id,
      type: project.type,
      title: project.title,
      platforms: project.platforms,
      contentPillar: project.contentPillar,
      workflowStatus: project.workflowStatus,
      currentStage: project.currentStage,
      nextAction: project.nextAction,
      blockedReason: project.blockedReason,
      priority: project.priority,
      publishAt: project.publishAt,
      referenceCount: referenceCounts.get(project.id) ?? 0,
      artifactCount: artifactCounts.get(project.id) ?? 0,
      aiState: resolveAiState(projectJobs, project.nextAction)
    };
  });

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    summary: {
      totalProjects: projects.length,
      blockedProjects: projects.filter(
        (project) => project.blockedReason.trim().length > 0
      ).length,
      awaitingReview: aiJobs.filter((job) => job.status === "awaiting_review").length,
      readyThisWeek: projects.filter((project) => {
        if (project.workflowStatus !== "ready" || project.publishAt.trim() === "") {
          return false;
        }
        const publishAt = new Date(project.publishAt);
        return (
          !Number.isNaN(publishAt.getTime()) &&
          publishAt >= now &&
          publishAt <= sevenDaysFromNow
        );
      }).length,
      aiRunning: aiJobs.filter(
        (job) => job.status === "queued" || job.status === "running"
      ).length
    },
    columns: columns.map((column) => ({
      ...column,
      cards: cards.filter((card) => card.workflowStatus === column.status)
    })),
    aiQueue: {
      running: aiJobs
        .filter((job) => job.status === "queued" || job.status === "running")
        .map((job) => ({
          id: job.id,
          projectId: job.projectId,
          action: job.action,
          status: job.status
        })),
      awaitingReview: aiJobs
        .filter((job) => job.status === "awaiting_review")
        .map((job) => ({
          id: job.id,
          projectId: job.projectId,
          action: job.action,
          status: job.status,
          outputArtifactId: job.outputArtifactId
        })),
      failed: aiJobs
        .filter((job) => job.status === "failed")
        .map((job) => ({
          id: job.id,
          projectId: job.projectId,
          action: job.action,
          error: job.error
        })),
      availableActions
    }
  };
}

function resolveAiState(
  jobs: ReturnType<ReturnType<typeof createDatabase>["listAiJobs"]>,
  nextAction: string
): WorkbenchCard["aiState"] {
  if (jobs.some((job) => job.status === "failed")) {
    return "failed";
  }
  if (jobs.some((job) => job.status === "awaiting_review")) {
    return "awaiting_review";
  }
  if (jobs.some((job) => job.status === "queued" || job.status === "running")) {
    return "running";
  }
  if (nextAction.trim().length > 0) {
    return "actionable";
  }
  return "idle";
}
