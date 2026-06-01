import Database from "better-sqlite3";
import type {
  AiJob,
  AiJobStatus,
  Artifact,
  ArtifactStatus,
  ContentProject,
  ContentType,
  CreateAiJobInput,
  CreateArtifactInput,
  CreateProjectInput,
  CreateReferenceInput,
  Priority,
  ReferenceItem,
  WorkflowStatus
} from "./domain";

interface AssetPlan {
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

const legacyTemplates: WorkflowTemplate[] = [
  {
    id: "template_image_text",
    type: "image_text",
    name: "AI 原生图文工作流",
    stages: [
      "内容支柱校准",
      "对标研究",
      "对标诊断",
      "图片规划",
      "正文草稿",
      "AI 诊断优化",
      "发布包",
      "复盘"
    ],
    checklist: [
      "收集对标内容",
      "提炼目标用户痛点",
      "规划封面和图片页顺序",
      "撰写正文和平台发布文案",
      "发布前运行 AI 诊断",
      "导出 Markdown 生产简报"
    ],
    assetDefaults: [
      {
        id: "asset_cover",
        kind: "image",
        title: "封面图",
        purpose: "让用户一眼看懂这篇内容承诺解决什么问题",
        status: "planned"
      },
      {
        id: "asset_carousel",
        kind: "image",
        title: "图片页序列",
        purpose: "把方法拆成值得收藏的多图阅读路径",
        status: "planned"
      }
    ]
  },
  {
    id: "template_video",
    type: "video",
    name: "AI 原生视频工作流",
    stages: [
      "内容支柱校准",
      "对标视频采集",
      "ASR 转写",
      "视频诊断",
      "口播稿草稿",
      "口播稿诊断",
      "录制",
      "粗剪",
      "最终剪辑",
      "复盘"
    ],
    checklist: [
      "收集对标视频",
      "粘贴或生成 ASR 转写稿",
      "诊断开头、结构、证据、节奏和 CTA",
      "撰写口播稿",
      "录制前运行 AI 诊断",
      "导出 Markdown 生产简报"
    ],
    assetDefaults: [
      {
        id: "asset_reference_video",
        kind: "video",
        title: "对标视频",
        purpose: "分析开头、节奏、结构、证据和 CTA",
        status: "planned"
      },
      {
        id: "asset_recording",
        kind: "video",
        title: "录制素材",
        purpose: "在粗剪前保存最终口播录制版本",
        status: "planned"
      },
      {
        id: "asset_transcript",
        kind: "document",
        title: "ASR 转写稿",
        purpose: "让视频内容可以被 AI 诊断和编辑",
        status: "planned"
      }
    ]
  }
];

const serialize = (value: unknown) => JSON.stringify(value);
const parse = <T>(value: string): T => JSON.parse(value) as T;

const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

interface TableInfoRow {
  name: string;
}

type ProjectMigrationRow = Record<string, unknown>;

interface ProjectRow {
  id: string;
  type: string;
  title: string;
  content_pillar: string;
  platforms_json: string;
  workflow_status: string;
  current_stage: string;
  next_action: string;
  blocked_reason: string;
  priority: string;
  target_audience: string;
  promise: string;
  goal: string;
  publish_at: string;
  created_at: string;
  updated_at: string;
}

interface ReferenceRow {
  id: string;
  project_id: string | null;
  source_type: string;
  content_type: string;
  platform: string;
  url: string;
  title: string;
  author: string;
  raw_text: string;
  transcript: string;
  screenshots_json: string;
  metrics_json: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ArtifactRow {
  id: string;
  project_id: string;
  type: string;
  stage: string;
  title: string;
  content: string;
  structured_data_json: string;
  source: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AiJobRow {
  id: string;
  project_id: string | null;
  stage: string;
  action: string;
  scope: string;
  status: string;
  input_snapshot_json: string;
  output_json: string;
  output_artifact_id: string | null;
  accepted_target: string;
  error: string;
  created_at: string;
  updated_at: string;
}

const readProject = (row: ProjectRow): ContentProject => ({
  id: row.id,
  type: row.type as ContentType,
  title: row.title,
  contentPillar: row.content_pillar,
  platforms: parse<string[]>(row.platforms_json),
  workflowStatus: row.workflow_status as WorkflowStatus,
  currentStage: row.current_stage,
  nextAction: row.next_action,
  blockedReason: row.blocked_reason,
  priority: row.priority as Priority,
  targetAudience: row.target_audience,
  promise: row.promise,
  goal: row.goal,
  publishAt: row.publish_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const readReference = (row: ReferenceRow): ReferenceItem => ({
  id: row.id,
  projectId: row.project_id,
  sourceType: row.source_type as ReferenceItem["sourceType"],
  contentType: row.content_type as ReferenceItem["contentType"],
  platform: row.platform,
  url: row.url,
  title: row.title,
  author: row.author,
  rawText: row.raw_text,
  transcript: row.transcript,
  screenshots: parse<string[]>(row.screenshots_json),
  metrics: parse<Record<string, number>>(row.metrics_json),
  notes: row.notes,
  status: row.status as ReferenceItem["status"],
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const readArtifact = (row: ArtifactRow): Artifact => ({
  id: row.id,
  projectId: row.project_id,
  type: row.type as Artifact["type"],
  stage: row.stage,
  title: row.title,
  content: row.content,
  structuredData: parse<Record<string, unknown>>(row.structured_data_json),
  source: row.source as Artifact["source"],
  version: row.version,
  status: row.status as ArtifactStatus,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const readAiJob = (row: AiJobRow): AiJob => ({
  id: row.id,
  projectId: row.project_id,
  stage: row.stage,
  action: row.action,
  scope: row.scope as AiJob["scope"],
  status: row.status as AiJobStatus,
  inputSnapshot: parse<Record<string, unknown>>(row.input_snapshot_json),
  output: parse<Record<string, unknown>>(row.output_json),
  outputArtifactId: row.output_artifact_id,
  acceptedTarget: row.accepted_target,
  error: row.error,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const defaultProjectStage = (_type: ContentType) => "topic";
const defaultProjectNextAction = (type: ContentType) =>
  type === "video" ? "补充对标视频或转写稿" : "补充对标素材";

const workflowStatuses: WorkflowStatus[] = [
  "idea",
  "reference",
  "draft",
  "production",
  "ready",
  "published",
  "reviewed"
];

const normalizeWorkflowStatus = (status: string): WorkflowStatus =>
  workflowStatuses.includes(status as WorkflowStatus)
    ? (status as WorkflowStatus)
    : "idea";

const splitLegacyPlatforms = (platform: string): string[] => {
  const platforms = platform
    .split(/[、,，/]+|\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return platforms.length > 0 ? platforms : ["未指定平台"];
};

function migrateProjectSchema(db: Database.Database) {
  const columns = new Set(
    db
      .prepare("PRAGMA table_info(projects)")
      .all()
      .map((row) => (row as TableInfoRow).name)
  );

  if (columns.has("pillar") || columns.has("platform") || columns.has("references_json")) {
    rebuildLegacyProjectTable(db);
    return;
  }

  const addColumn = (name: string, definition: string) => {
    if (!columns.has(name)) {
      db.prepare(`ALTER TABLE projects ADD COLUMN ${name} ${definition}`).run();
      columns.add(name);
    }
  };

  addColumn("content_pillar", "TEXT NOT NULL DEFAULT ''");
  addColumn("platforms_json", "TEXT NOT NULL DEFAULT '[]'");
  addColumn("workflow_status", "TEXT NOT NULL DEFAULT 'idea'");
  addColumn("current_stage", "TEXT NOT NULL DEFAULT 'topic'");
  addColumn("next_action", "TEXT NOT NULL DEFAULT ''");
  addColumn("blocked_reason", "TEXT NOT NULL DEFAULT ''");
  addColumn("priority", "TEXT NOT NULL DEFAULT 'normal'");
  addColumn("promise", "TEXT NOT NULL DEFAULT ''");
  addColumn("publish_at", "TEXT NOT NULL DEFAULT ''");
}

function rebuildLegacyProjectTable(db: Database.Database) {
  const rows = db.prepare("SELECT * FROM projects").all() as ProjectMigrationRow[];
  const projects = rows.map((row) => normalizeProjectMigrationRow(row));

  const migrate = db.transaction(() => {
    db.exec(`
      ALTER TABLE projects RENAME TO projects_legacy_migration;

      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content_pillar TEXT NOT NULL,
        platforms_json TEXT NOT NULL,
        workflow_status TEXT NOT NULL,
        current_stage TEXT NOT NULL,
        next_action TEXT NOT NULL,
        blocked_reason TEXT NOT NULL,
        priority TEXT NOT NULL,
        target_audience TEXT NOT NULL,
        promise TEXT NOT NULL,
        goal TEXT NOT NULL,
        publish_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const insert = db.prepare(`
      INSERT INTO projects (
        id, type, title, content_pillar, platforms_json, workflow_status,
        current_stage, next_action, blocked_reason, priority,
        target_audience, promise, goal, publish_at, created_at, updated_at
      ) VALUES (
        @id, @type, @title, @contentPillar, @platforms, @workflowStatus,
        @currentStage, @nextAction, @blockedReason, @priority,
        @targetAudience, @promise, @goal, @publishAt, @createdAt, @updatedAt
      )
    `);

    for (const project of projects) {
      insert.run({
        ...project,
        platforms: serialize(project.platforms)
      });
    }

    db.exec("DROP TABLE projects_legacy_migration");
  });

  migrate();
}

function normalizeProjectMigrationRow(row: ProjectMigrationRow): ContentProject {
  const type = stringValue(row.type) === "video" ? "video" : "image_text";
  const platforms = parsePlatformsValue(row.platforms_json, row.platform);
  const goal = stringValue(row.goal) || stringValue(row.promise);
  const promise = stringValue(row.promise) || goal;

  return {
    id: stringValue(row.id),
    type,
    title: stringValue(row.title),
    contentPillar: stringValue(row.content_pillar) || stringValue(row.pillar),
    platforms,
    workflowStatus: normalizeWorkflowStatus(
      stringValue(row.workflow_status) || stringValue(row.status)
    ),
    currentStage: stringValue(row.current_stage) || defaultProjectStage(type),
    nextAction: stringValue(row.next_action) || defaultProjectNextAction(type),
    blockedReason: stringValue(row.blocked_reason),
    priority: stringValue(row.priority) === "high" || stringValue(row.priority) === "low"
      ? (stringValue(row.priority) as Priority)
      : "normal",
    targetAudience: stringValue(row.target_audience),
    promise,
    goal,
    publishAt: stringValue(row.publish_at),
    createdAt: stringValue(row.created_at) || nowIso(),
    updatedAt: stringValue(row.updated_at) || nowIso()
  };
}

function parsePlatformsValue(
  platformsJson: unknown,
  legacyPlatform: unknown
): string[] {
  if (typeof platformsJson === "string" && platformsJson.trim().length > 0) {
    try {
      const parsed = parse<string[]>(platformsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      return splitLegacyPlatforms(stringValue(legacyPlatform));
    }
  }

  return splitLegacyPlatforms(stringValue(legacyPlatform));
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function createDatabase(path: string) {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content_pillar TEXT NOT NULL,
      platforms_json TEXT NOT NULL,
      workflow_status TEXT NOT NULL,
      current_stage TEXT NOT NULL,
      next_action TEXT NOT NULL,
      blocked_reason TEXT NOT NULL,
      priority TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      promise TEXT NOT NULL,
      goal TEXT NOT NULL,
      publish_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reference_items (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      source_type TEXT NOT NULL,
      content_type TEXT NOT NULL,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      transcript TEXT NOT NULL,
      screenshots_json TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      notes TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      stage TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      structured_data_json TEXT NOT NULL,
      source TEXT NOT NULL,
      version INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      stage TEXT NOT NULL,
      action TEXT NOT NULL,
      scope TEXT NOT NULL,
      status TEXT NOT NULL,
      input_snapshot_json TEXT NOT NULL,
      output_json TEXT NOT NULL,
      output_artifact_id TEXT,
      accepted_target TEXT NOT NULL,
      error TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS publish_plans (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      asset_checklist_json TEXT NOT NULL,
      published_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS retrospectives (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      comment_insights_json TEXT NOT NULL,
      learnings TEXT NOT NULL,
      next_ideas_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  migrateProjectSchema(db);

  return {
    listTemplates(): WorkflowTemplate[] {
      return legacyTemplates.map((template) => ({
        ...template,
        stages: [...template.stages],
        checklist: [...template.checklist],
        assetDefaults: template.assetDefaults.map((asset) => ({ ...asset }))
      }));
    },

    createProject(input: CreateProjectInput): ContentProject {
      const timestamp = nowIso();
      const project: ContentProject = {
        id: id("project"),
        type: input.type,
        title: input.title,
        contentPillar: input.contentPillar,
        platforms: input.platforms,
        workflowStatus: input.workflowStatus ?? "idea",
        currentStage: defaultProjectStage(input.type),
        nextAction: defaultProjectNextAction(input.type),
        blockedReason: "",
        priority: "normal",
        targetAudience: input.targetAudience,
        promise: input.promise,
        goal: input.goal,
        publishAt: "",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      db.prepare(`
        INSERT INTO projects (
          id, type, title, content_pillar, platforms_json, workflow_status,
          current_stage, next_action, blocked_reason, priority,
          target_audience, promise, goal, publish_at, created_at, updated_at
        ) VALUES (
          @id, @type, @title, @contentPillar, @platforms, @workflowStatus,
          @currentStage, @nextAction, @blockedReason, @priority,
          @targetAudience, @promise, @goal, @publishAt, @createdAt, @updatedAt
        )
      `).run({
        ...project,
        platforms: serialize(project.platforms)
      });

      return project;
    },

    listProjects(): ContentProject[] {
      return db
        .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
        .all()
        .map((row) => readProject(row as ProjectRow));
    },

    getProject(projectId: string): ContentProject | undefined {
      const row = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(projectId) as ProjectRow | undefined;
      return row ? readProject(row) : undefined;
    },

    updateProject(project: ContentProject): ContentProject {
      const updated: ContentProject = {
        ...project,
        updatedAt: nowIso()
      };

      db.prepare(`
        UPDATE projects SET
          title = @title,
          content_pillar = @contentPillar,
          platforms_json = @platforms,
          workflow_status = @workflowStatus,
          current_stage = @currentStage,
          next_action = @nextAction,
          blocked_reason = @blockedReason,
          priority = @priority,
          target_audience = @targetAudience,
          promise = @promise,
          goal = @goal,
          publish_at = @publishAt,
          updated_at = @updatedAt
        WHERE id = @id
      `).run({
        ...updated,
        platforms: serialize(updated.platforms)
      });

      return updated;
    },

    createReference(input: CreateReferenceInput): ReferenceItem {
      const timestamp = nowIso();
      const reference: ReferenceItem = {
        id: id("reference"),
        projectId: input.projectId,
        sourceType: input.sourceType,
        contentType: input.contentType,
        platform: input.platform,
        url: input.url,
        title: input.title,
        author: input.author ?? "",
        rawText: input.rawText ?? "",
        transcript: input.transcript ?? "",
        screenshots: input.screenshots ?? [],
        metrics: input.metrics ?? {},
        notes: input.notes,
        status: "collected",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      db.prepare(`
        INSERT INTO reference_items (
          id, project_id, source_type, content_type, platform, url, title,
          author, raw_text, transcript, screenshots_json, metrics_json, notes,
          status, created_at, updated_at
        ) VALUES (
          @id, @projectId, @sourceType, @contentType, @platform, @url, @title,
          @author, @rawText, @transcript, @screenshots, @metrics, @notes,
          @status, @createdAt, @updatedAt
        )
      `).run({
        ...reference,
        screenshots: serialize(reference.screenshots),
        metrics: serialize(reference.metrics)
      });

      return reference;
    },

    listReferences(projectId?: string): ReferenceItem[] {
      const statement =
        projectId === undefined
          ? db.prepare("SELECT * FROM reference_items ORDER BY updated_at DESC")
          : db.prepare(
              "SELECT * FROM reference_items WHERE project_id = ? ORDER BY updated_at DESC"
            );
      const rows =
        projectId === undefined ? statement.all() : statement.all(projectId);
      return rows.map((row) => readReference(row as ReferenceRow));
    },

    createArtifact(input: CreateArtifactInput): Artifact {
      const timestamp = nowIso();
      const artifact: Artifact = {
        id: id("artifact"),
        projectId: input.projectId,
        type: input.type,
        stage: input.stage,
        title: input.title,
        content: input.content,
        structuredData: input.structuredData,
        source: input.source,
        version: 1,
        status: "draft",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      db.prepare(`
        INSERT INTO artifacts (
          id, project_id, type, stage, title, content, structured_data_json,
          source, version, status, created_at, updated_at
        ) VALUES (
          @id, @projectId, @type, @stage, @title, @content, @structuredData,
          @source, @version, @status, @createdAt, @updatedAt
        )
      `).run({
        ...artifact,
        structuredData: serialize(artifact.structuredData)
      });

      return artifact;
    },

    listArtifacts(projectId: string): Artifact[] {
      return db
        .prepare("SELECT * FROM artifacts WHERE project_id = ? ORDER BY updated_at DESC")
        .all(projectId)
        .map((row) => readArtifact(row as ArtifactRow));
    },

    acceptArtifact(artifactId: string): Artifact {
      return updateArtifactStatus(artifactId, "accepted");
    },

    archiveArtifact(artifactId: string): Artifact {
      return updateArtifactStatus(artifactId, "archived");
    },

    createAiJob(input: CreateAiJobInput): AiJob {
      const timestamp = nowIso();
      const job: AiJob = {
        id: id("ai_job"),
        projectId: input.projectId,
        stage: input.stage,
        action: input.action,
        scope: input.scope,
        status: input.status,
        inputSnapshot: input.inputSnapshot,
        output: input.output,
        outputArtifactId: input.outputArtifactId,
        acceptedTarget: input.acceptedTarget,
        error: input.error,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      db.prepare(`
        INSERT INTO ai_jobs (
          id, project_id, stage, action, scope, status, input_snapshot_json,
          output_json, output_artifact_id, accepted_target, error,
          created_at, updated_at
        ) VALUES (
          @id, @projectId, @stage, @action, @scope, @status, @inputSnapshot,
          @output, @outputArtifactId, @acceptedTarget, @error,
          @createdAt, @updatedAt
        )
      `).run({
        ...job,
        inputSnapshot: serialize(job.inputSnapshot),
        output: serialize(job.output)
      });

      return job;
    },

    listAiJobs(filter?: { projectId?: string; status?: AiJobStatus }): AiJob[] {
      if (filter?.projectId && filter.status) {
        return db
          .prepare(
            "SELECT * FROM ai_jobs WHERE project_id = ? AND status = ? ORDER BY updated_at DESC"
          )
          .all(filter.projectId, filter.status)
          .map((row) => readAiJob(row as AiJobRow));
      }

      if (filter?.projectId) {
        return db
          .prepare("SELECT * FROM ai_jobs WHERE project_id = ? ORDER BY updated_at DESC")
          .all(filter.projectId)
          .map((row) => readAiJob(row as AiJobRow));
      }

      if (filter?.status) {
        return db
          .prepare("SELECT * FROM ai_jobs WHERE status = ? ORDER BY updated_at DESC")
          .all(filter.status)
          .map((row) => readAiJob(row as AiJobRow));
      }

      return db
        .prepare("SELECT * FROM ai_jobs ORDER BY updated_at DESC")
        .all()
        .map((row) => readAiJob(row as AiJobRow));
    },

    getAiJob(jobId: string): AiJob | undefined {
      const row = db
        .prepare("SELECT * FROM ai_jobs WHERE id = ?")
        .get(jobId) as AiJobRow | undefined;
      return row ? readAiJob(row) : undefined;
    },

    updateAiJob(job: AiJob): AiJob {
      const updated: AiJob = {
        ...job,
        updatedAt: nowIso()
      };

      db.prepare(`
        UPDATE ai_jobs SET
          project_id = @projectId,
          stage = @stage,
          action = @action,
          scope = @scope,
          status = @status,
          input_snapshot_json = @inputSnapshot,
          output_json = @output,
          output_artifact_id = @outputArtifactId,
          accepted_target = @acceptedTarget,
          error = @error,
          updated_at = @updatedAt
        WHERE id = @id
      `).run({
        ...updated,
        inputSnapshot: serialize(updated.inputSnapshot),
        output: serialize(updated.output)
      });

      return updated;
    },

    acceptAiJob(jobId: string): AiJob {
      const job = this.getAiJob(jobId);
      if (!job) {
        throw new Error(`AI job not found: ${jobId}`);
      }

      if (job.outputArtifactId) {
        const artifact = this.acceptArtifact(job.outputArtifactId);
        advanceProjectAfterArtifactAccepted(artifact);
      }

      return this.updateAiJob({ ...job, status: "accepted" });
    },

    rejectAiJob(jobId: string): AiJob {
      const job = this.getAiJob(jobId);
      if (!job) {
        throw new Error(`AI job not found: ${jobId}`);
      }

      if (job.outputArtifactId) {
        this.archiveArtifact(job.outputArtifactId);
      }

      return this.updateAiJob({ ...job, status: "rejected" });
    },

    close(): void {
      db.close();
    }
  };

  function updateArtifactStatus(
    artifactId: string,
    status: ArtifactStatus
  ): Artifact {
    const updatedAt = nowIso();
    db.prepare("UPDATE artifacts SET status = ?, updated_at = ? WHERE id = ?").run(
      status,
      updatedAt,
      artifactId
    );
    const row = db
      .prepare("SELECT * FROM artifacts WHERE id = ?")
      .get(artifactId) as ArtifactRow | undefined;
    if (!row) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }
    return readArtifact(row);
  }

  function advanceProjectAfterArtifactAccepted(artifact: Artifact) {
    const project = (db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(artifact.projectId) as ProjectRow | undefined);
    if (!project) {
      return;
    }

    const current = readProject(project);
    const advancement = resolveProjectAdvancement(current, artifact);
    if (!advancement) {
      return;
    }

    const updated: ContentProject = {
      ...current,
      ...advancement,
      updatedAt: nowIso()
    };

    db.prepare(`
      UPDATE projects SET
        workflow_status = @workflowStatus,
        current_stage = @currentStage,
        next_action = @nextAction,
        updated_at = @updatedAt
      WHERE id = @id
    `).run(updated);
  }
}

function resolveProjectAdvancement(
  project: ContentProject,
  artifact: Artifact
): Pick<ContentProject, "workflowStatus" | "currentStage" | "nextAction"> | undefined {
  if (project.type === "image_text") {
    if (artifact.type === "diagnosis") {
      return {
        workflowStatus: "draft",
        currentStage: "image_plan",
        nextAction: "生成图片规划"
      };
    }
    if (artifact.type === "image_plan") {
      return {
        workflowStatus: "production",
        currentStage: "publish_pack",
        nextAction: "生成图文发布包"
      };
    }
    if (artifact.type === "publish_pack") {
      return {
        workflowStatus: "ready",
        currentStage: "publish_pack",
        nextAction: "检查并发布"
      };
    }
  }

  if (project.type === "video") {
    if (artifact.type === "diagnosis") {
      return {
        workflowStatus: "draft",
        currentStage: "script",
        nextAction: "生成口播脚本"
      };
    }
    if (artifact.type === "script") {
      return {
        workflowStatus: "production",
        currentStage: "edit_plan",
        nextAction: "生成剪辑清单"
      };
    }
    if (artifact.type === "cut_list") {
      return {
        workflowStatus: "ready",
        currentStage: "publish_pack",
        nextAction: "检查剪辑清单并准备发布"
      };
    }
  }

  return undefined;
}
