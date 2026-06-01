import type {
  AiAction,
  AiJob,
  AiRunResult,
  ContentProject,
  CreateAiJobInput,
  CreateProjectInput,
  CreateReferenceInput,
  ReferenceItem,
  StudioState,
  WorkbenchState,
  WorkflowTemplate
} from "./types";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

export const api = {
  templates: () => request<WorkflowTemplate[]>("/api/templates"),
  projects: () => request<ContentProject[]>("/api/projects"),
  getWorkbench: () => request<WorkbenchState>("/api/workbench"),
  getStudio: (projectId: string) =>
    request<StudioState>(`/api/projects/${projectId}/studio`),
  createProject: (input: CreateProjectInput) =>
    request<ContentProject>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  createReference: (input: CreateReferenceInput) =>
    request<ReferenceItem>("/api/references", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  createProjectReference: (
    projectId: string,
    input: Omit<CreateReferenceInput, "projectId">
  ) =>
    request<ReferenceItem>(`/api/projects/${projectId}/references`, {
      method: "POST",
      body: JSON.stringify(input)
    }),
  listAiJobs: () => request<AiJob[]>("/api/ai/jobs"),
  createAiJob: (input: CreateAiJobInput) =>
    request<AiJob>("/api/ai/jobs", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  acceptAiJob: (id: string) =>
    request<AiJob>(`/api/ai/jobs/${id}/accept`, { method: "POST" }),
  rejectAiJob: (id: string) =>
    request<AiJob>(`/api/ai/jobs/${id}/reject`, { method: "POST" }),
  runAi: (input: {
    action: AiAction;
    projectId: string;
    userNotes: string;
  }) =>
    request<AiRunResult>("/api/ai/run", {
      method: "POST",
      body: JSON.stringify(input)
    })
};
