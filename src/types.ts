export type ContentType = "image_text" | "video";

export type WorkflowStatus =
  | "idea"
  | "reference"
  | "draft"
  | "production"
  | "ready"
  | "published"
  | "reviewed";

export type Priority = "low" | "normal" | "high";

export interface ContentProject {
  id: string;
  type: ContentType;
  title: string;
  contentPillar: string;
  platforms: string[];
  workflowStatus: WorkflowStatus;
  currentStage: string;
  nextAction: string;
  blockedReason: string;
  priority: Priority;
  targetAudience: string;
  promise: string;
  goal: string;
  publishAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceItem {
  id: string;
  projectId: string | null;
  sourceType: "url" | "file" | "note" | "transcript" | "comment";
  contentType: ContentType | "mixed";
  platform: string;
  url: string;
  title: string;
  author: string;
  rawText: string;
  transcript: string;
  screenshots: string[];
  metrics: Record<string, number>;
  notes: string;
  status: "collected" | "transcribed" | "diagnosed" | "used";
  createdAt: string;
  updatedAt: string;
}

export interface Artifact {
  id: string;
  projectId: string;
  type:
    | "brief"
    | "diagnosis"
    | "title_set"
    | "cover_plan"
    | "image_plan"
    | "body_copy"
    | "caption"
    | "transcript"
    | "script"
    | "storyboard"
    | "recording_plan"
    | "cut_list"
    | "publish_pack"
    | "retrospective";
  stage: string;
  title: string;
  content: string;
  structuredData: Record<string, unknown>;
  source: "human" | "ai" | "imported";
  version: number;
  status: "draft" | "accepted" | "archived";
  createdAt: string;
  updatedAt: string;
}

export type AiJobStatus =
  | "queued"
  | "running"
  | "awaiting_review"
  | "accepted"
  | "rejected"
  | "failed";

export interface AiJob {
  id: string;
  projectId: string | null;
  stage: string;
  action: string;
  scope: "global" | "project" | "stage";
  status: AiJobStatus;
  inputSnapshot: Record<string, unknown>;
  output: Record<string, unknown>;
  outputArtifactId: string | null;
  acceptedTarget: string;
  error: string;
  createdAt: string;
  updatedAt: string;
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

export interface StudioStage {
  id: string;
  label: string;
  description: string;
}

export interface StudioAiAction {
  id: string;
  label: string;
  stage: string;
}

export interface StudioState {
  project: ContentProject;
  stages: StudioStage[];
  currentStage: StudioStage;
  references: ReferenceItem[];
  acceptedArtifacts: Artifact[];
  draftArtifacts: Artifact[];
  availableAiActions: StudioAiAction[];
  relatedAiJobs: AiJob[];
}

export interface CreateProjectInput {
  type: ContentType;
  title: string;
  contentPillar: string;
  platforms: string[];
  targetAudience: string;
  promise: string;
  goal: string;
  workflowStatus?: WorkflowStatus;
}

export interface CreateReferenceInput {
  projectId: string | null;
  sourceType: ReferenceItem["sourceType"];
  contentType: ReferenceItem["contentType"];
  platform: string;
  url: string;
  title: string;
  notes: string;
  author?: string;
  rawText?: string;
  transcript?: string;
  screenshots?: string[];
  metrics?: Record<string, number>;
}

export interface CreateAiJobInput {
  actionId: string;
  projectId: string;
  stage: string;
}

export interface AssetPlan {
  id: string;
  kind: "image" | "video" | "audio" | "document";
  title: string;
  purpose: string;
  status: "planned" | "in_progress" | "done";
}

export interface WorkflowTemplate {
  id: string;
  type: ContentType;
  name: string;
  stages: string[];
  checklist: string[];
  assetDefaults: AssetPlan[];
}

export type AiAction =
  | "ideate"
  | "diagnose_reference"
  | "draft"
  | "optimize"
  | "repurpose"
  | "publish_pack"
  | "retrospective";

export interface AiRunResult {
  action: AiAction;
  mode: "model" | "fallback";
  summary: string;
  sections: Array<{
    title: string;
    body: string;
    items: string[];
  }>;
  nextChecklist: string[];
}
