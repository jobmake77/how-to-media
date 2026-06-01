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

export type ReferenceSourceType =
  | "url"
  | "file"
  | "note"
  | "transcript"
  | "comment";

export type ReferenceStatus =
  | "collected"
  | "transcribed"
  | "diagnosed"
  | "used";

export type ArtifactType =
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

export type ArtifactStatus = "draft" | "accepted" | "archived";

export type AiJobStatus =
  | "queued"
  | "running"
  | "awaiting_review"
  | "accepted"
  | "rejected"
  | "failed";

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

export interface ReferenceItem {
  id: string;
  projectId: string | null;
  sourceType: ReferenceSourceType;
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
  status: ReferenceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReferenceInput {
  projectId: string | null;
  sourceType: ReferenceSourceType;
  contentType: ContentType | "mixed";
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

export interface Artifact {
  id: string;
  projectId: string;
  type: ArtifactType;
  stage: string;
  title: string;
  content: string;
  structuredData: Record<string, unknown>;
  source: "human" | "ai" | "imported";
  version: number;
  status: ArtifactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtifactInput {
  projectId: string;
  type: ArtifactType;
  stage: string;
  title: string;
  content: string;
  structuredData: Record<string, unknown>;
  source: "human" | "ai" | "imported";
}

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

export interface CreateAiJobInput {
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
}

export interface PublishPlan {
  id: string;
  projectId: string;
  platform: string;
  scheduledAt: string;
  status: "planned" | "ready" | "published" | "skipped";
  title: string;
  caption: string;
  tags: string[];
  assetChecklist: string[];
  publishedUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Retrospective {
  id: string;
  projectId: string;
  platform: string;
  metrics: Record<string, number>;
  commentInsights: string[];
  learnings: string;
  nextIdeas: string[];
  createdAt: string;
}

export type AiAction =
  | "ideate"
  | "diagnose_reference"
  | "draft"
  | "optimize"
  | "repurpose"
  | "publish_pack"
  | "retrospective";

export interface AiRunInput {
  action: AiAction;
  project: ContentProject;
  userNotes?: string;
}

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
