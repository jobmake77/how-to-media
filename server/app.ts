import cors from "cors";
import express from "express";
import { z } from "zod";
import { buildStudioState } from "./aggregations/studio";
import { buildWorkbenchState } from "./aggregations/workbench";
import { runAiJob } from "./ai/aiJobRunner";
import { runAiAction } from "./aiService";
import type { ContentProject } from "./domain";
import { createDatabase } from "./repository";

const createProjectSchema = z.object({
  type: z.enum(["image_text", "video"]),
  title: z.string().min(1),
  contentPillar: z.string().min(1),
  platforms: z.array(z.string().min(1)).min(1),
  targetAudience: z.string().min(1),
  promise: z.string().min(1),
  workflowStatus: z
    .enum(["idea", "reference", "draft", "production", "ready", "published", "reviewed"])
    .optional(),
  goal: z.string().min(1)
});

const createReferenceSchema = z.object({
  projectId: z.string().min(1).nullable().optional(),
  sourceType: z.enum(["url", "file", "note", "transcript", "comment"]),
  contentType: z.enum(["image_text", "video", "mixed"]),
  platform: z.string().min(1),
  url: z.string(),
  title: z.string().min(1),
  notes: z.string(),
  author: z.string().optional(),
  rawText: z.string().optional(),
  transcript: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  metrics: z.record(z.string(), z.number()).optional()
});

const aiRunSchema = z.object({
  action: z.enum([
    "ideate",
    "diagnose_reference",
    "draft",
    "optimize",
    "repurpose",
    "publish_pack",
    "retrospective"
  ]),
  projectId: z.string().min(1),
  userNotes: z.string().optional()
});

const aiJobSchema = z.object({
  actionId: z.string().min(1),
  projectId: z.string().min(1),
  stage: z.string().min(1)
});

export function createApp(options: {
  databasePath: string;
  openAiApiKey?: string;
  openAiModel: string;
}) {
  const repository = createDatabase(options.databasePath);
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.get("/api/templates", (_request, response) => {
    response.json(repository.listTemplates());
  });

  app.get("/api/workbench", (_request, response) => {
    response.json(buildWorkbenchState(repository));
  });

  app.get("/api/projects", (_request, response) => {
    response.json(repository.listProjects());
  });

  app.get("/api/projects/:id/studio", (request, response) => {
    const studio = buildStudioState(repository, request.params.id);
    if (!studio) {
      response.status(404).json({ error: "项目不存在" });
      return;
    }

    response.json(studio);
  });

  app.post("/api/projects", (request, response) => {
    const parsed = createProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    response.status(201).json(repository.createProject(parsed.data));
  });

  app.put("/api/projects/:id", (request, response) => {
    const existing = repository.getProject(request.params.id);
    if (!existing) {
      response.status(404).json({ error: "项目不存在" });
      return;
    }

    const nextProject = request.body as ContentProject;
    if (nextProject.id !== existing.id) {
      response.status(400).json({ error: "项目 ID 不匹配" });
      return;
    }

    response.json(repository.updateProject(nextProject));
  });

  app.get("/api/projects/:id/references", (request, response) => {
    const project = repository.getProject(request.params.id);
    if (!project) {
      response.status(404).json({ error: "项目不存在" });
      return;
    }

    response.json(repository.listReferences(project.id));
  });

  app.post("/api/projects/:id/references", (request, response) => {
    const project = repository.getProject(request.params.id);
    if (!project) {
      response.status(404).json({ error: "项目不存在" });
      return;
    }

    const parsed = createReferenceSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    response.status(201).json(
      repository.createReference({
        ...parsed.data,
        projectId: project.id
      })
    );
  });

  app.post("/api/references", (request, response) => {
    const parsed = createReferenceSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    if (parsed.data.projectId && !repository.getProject(parsed.data.projectId)) {
      response.status(404).json({ error: "项目不存在" });
      return;
    }

    response.status(201).json(
      repository.createReference({
        ...parsed.data,
        projectId: parsed.data.projectId ?? null
      })
    );
  });

  app.get("/api/ai/jobs", (_request, response) => {
    response.json(repository.listAiJobs());
  });

  app.post("/api/ai/jobs", async (request, response, next) => {
    try {
      const parsed = aiJobSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const job = await runAiJob(repository, parsed.data, {
        apiKey: options.openAiApiKey,
        model: options.openAiModel
      });
      response.status(201).json(job);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/jobs/:id/accept", (request, response, next) => {
    try {
      response.json(repository.acceptAiJob(request.params.id));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("AI job not found:")) {
        response.status(404).json({ error: "AI 任务不存在" });
        return;
      }
      next(error);
    }
  });

  app.post("/api/ai/jobs/:id/reject", (request, response, next) => {
    try {
      response.json(repository.rejectAiJob(request.params.id));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("AI job not found:")) {
        response.status(404).json({ error: "AI 任务不存在" });
        return;
      }
      next(error);
    }
  });

  app.post("/api/ai/run", async (request, response, next) => {
    try {
      const parsed = aiRunSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const project = repository.getProject(parsed.data.projectId);
      if (!project) {
        response.status(404).json({ error: "项目不存在" });
        return;
      }

      const result = await runAiAction(
        {
          action: parsed.data.action,
          project,
          userNotes: parsed.data.userNotes
        },
        {
          apiKey: options.openAiApiKey,
          model: options.openAiModel
        }
      );

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      const message =
        error instanceof Error ? error.message : "服务器发生未知错误";
      response.status(500).json({ error: message });
    }
  );

  return { app, repository };
}
