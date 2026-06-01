# AI Native Media Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the app into a status-driven local media production workbench with a pipeline homepage, project production studio, references, artifacts, and reviewable AI jobs.

**Architecture:** Keep the current React + Express + SQLite stack, but replace template-driven project data with production-driven resources. The backend owns aggregation (`/api/workbench`, `/api/projects/:id/studio`) and AI job lifecycle; the frontend renders focused workbench and studio views from those aggregates.

**Tech Stack:** React, Vite, TypeScript, Express, better-sqlite3, OpenAI Responses API, Vitest, Testing Library.

---

## File Structure

Create or refactor toward this structure:

```text
server/
├─ domain.ts
├─ repository.ts
├─ repository.test.ts
├─ app.ts
├─ app.test.ts
├─ ai/
│  ├─ actionRegistry.ts
│  ├─ contextBuilder.ts
│  ├─ promptBuilder.ts
│  ├─ modelClient.ts
│  ├─ aiJobRunner.ts
│  └─ aiJobRunner.test.ts
└─ aggregations/
   ├─ workbench.ts
   ├─ workbench.test.ts
   ├─ studio.ts
   └─ studio.test.ts

src/
├─ app/
│  ├─ AppShell.tsx
│  ├─ WorkbenchPage.tsx
│  ├─ ProductionStudioPage.tsx
│  └─ AppShell.test.tsx
├─ features/
│  ├─ projects/
│  │  ├─ ProjectCard.tsx
│  │  ├─ ProjectPipeline.tsx
│  │  ├─ ProjectCreateDialog.tsx
│  │  └─ projectApi.ts
│  ├─ studio/
│  │  ├─ StageNavigator.tsx
│  │  ├─ StageEditor.tsx
│  │  ├─ ImageTextStudio.tsx
│  │  └─ VideoStudio.tsx
│  ├─ ai/
│  │  ├─ AiQueuePanel.tsx
│  │  ├─ AiJobCard.tsx
│  │  ├─ AiActionList.tsx
│  │  └─ aiApi.ts
│  └─ references/
│     ├─ ReferenceLibrary.tsx
│     └─ ReferenceAttachDialog.tsx
├─ shared/
│  ├─ types.ts
│  ├─ formatters.ts
│  └─ ui/
└─ main.tsx
```

Keep the UI language Chinese. Keep code identifiers, comments, and commit messages English.

## Task 1: Domain Model and SQLite Schema

**Files:**
- Modify: `server/domain.ts`
- Modify: `server/repository.ts`
- Modify: `server/repository.test.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: Write failing repository tests for the new domain**

Add tests that verify:

```ts
const db = createDatabase(":memory:");

const project = db.createProject({
  type: "image_text",
  title: "AI 图文选题",
  contentPillar: "AI 工作流",
  platforms: ["小红书"],
  targetAudience: "个人创作者",
  promise: "用一套流程稳定产出图文",
  goal: "进入图文生产流水线",
  workflowStatus: "idea"
});

expect(project.workflowStatus).toBe("idea");
expect(project.currentStage).toBe("topic");
expect(project.nextAction).toBe("补充对标素材");

const reference = db.createReference({
  projectId: project.id,
  sourceType: "url",
  contentType: "image_text",
  platform: "小红书",
  url: "https://example.com/post",
  title: "对标图文",
  notes: "结构值得参考"
});

expect(db.listReferences(project.id)).toHaveLength(1);
expect(reference.status).toBe("collected");

const artifact = db.createArtifact({
  projectId: project.id,
  type: "image_plan",
  stage: "image_plan",
  title: "图片页规划",
  content: "第 1 页封面，第 2 页问题定义",
  structuredData: { pages: 2 },
  source: "ai"
});

expect(artifact.status).toBe("draft");
expect(db.acceptArtifact(artifact.id).status).toBe("accepted");
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- server/repository.test.ts
```

Expected: fails because repository methods and fields do not exist yet.

- [ ] **Step 3: Implement domain types**

Update `server/domain.ts` and mirror compatible client types in `src/types.ts`:

```ts
export type WorkflowStatus =
  | "idea"
  | "reference"
  | "draft"
  | "production"
  | "ready"
  | "published"
  | "reviewed";

export type ContentType = "image_text" | "video";
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
```

- [ ] **Step 4: Implement SQLite tables and repository methods**

Update `server/repository.ts` to create these tables:

```sql
projects
references
artifacts
ai_jobs
publish_plans
retrospectives
```

Implement at minimum:

```ts
createProject(input)
listProjects()
getProject(id)
updateProject(project)
createReference(input)
listReferences(projectId?: string)
createArtifact(input)
listArtifacts(projectId)
acceptArtifact(id)
archiveArtifact(id)
```

Default stage and next action:

```ts
image_text -> currentStage: "topic", nextAction: "补充对标素材"
video -> currentStage: "topic", nextAction: "补充对标视频或转写稿"
```

- [ ] **Step 5: Run repository tests**

Run:

```bash
npm test -- server/repository.test.ts
```

Expected: repository tests pass.

## Task 2: Workbench Aggregation

**Files:**
- Create: `server/aggregations/workbench.ts`
- Create: `server/aggregations/workbench.test.ts`
- Modify: `server/app.ts`

- [ ] **Step 1: Write failing aggregation test**

Create a test that seeds projects in at least three statuses, one awaiting AI job, and one blocked project. Expected output:

```ts
const state = buildWorkbenchState(repository);

expect(state.columns.map((column) => column.status)).toEqual([
  "idea",
  "reference",
  "draft",
  "production",
  "ready",
  "published",
  "reviewed"
]);
expect(state.summary.totalProjects).toBe(3);
expect(state.summary.blockedProjects).toBe(1);
expect(state.columns.find((column) => column.status === "idea")?.cards[0]).toMatchObject({
  title: "AI 图文选题",
  nextAction: "补充对标素材",
  referenceCount: 1,
  artifactCount: 0
});
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- server/aggregations/workbench.test.ts
```

Expected: fails because aggregation module does not exist.

- [ ] **Step 3: Implement workbench aggregation**

Define:

```ts
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
```

Column titles must be Chinese:

```ts
idea -> "选题池"
reference -> "对标/素材"
draft -> "草稿/脚本"
production -> "制作/剪辑"
ready -> "待发布"
published -> "已发布"
reviewed -> "已复盘"
```

- [ ] **Step 4: Add API route**

Add:

```ts
GET /api/workbench
```

It returns `buildWorkbenchState(repository)`.

- [ ] **Step 5: Run aggregation and app tests**

Run:

```bash
npm test -- server/aggregations/workbench.test.ts server/app.test.ts
```

Expected: tests pass.

## Task 3: Studio Aggregation

**Files:**
- Create: `server/aggregations/studio.ts`
- Create: `server/aggregations/studio.test.ts`
- Modify: `server/app.ts`

- [ ] **Step 1: Write failing studio aggregation tests**

Test both content types:

```ts
const imageStudio = buildStudioState(repository, imageProject.id);
expect(imageStudio.stages.map((stage) => stage.id)).toEqual([
  "topic",
  "references",
  "diagnosis",
  "title_cover",
  "image_plan",
  "body_caption",
  "publish_pack",
  "retrospective"
]);

const videoStudio = buildStudioState(repository, videoProject.id);
expect(videoStudio.stages.map((stage) => stage.id)).toEqual([
  "topic",
  "reference_videos",
  "asr_transcript",
  "diagnosis",
  "script",
  "recording_plan",
  "edit_plan",
  "publish_pack",
  "retrospective"
]);

expect(imageStudio.availableAiActions.length).toBeGreaterThan(0);
expect(videoStudio.references).toHaveLength(1);
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- server/aggregations/studio.test.ts
```

Expected: fails because studio aggregation does not exist.

- [ ] **Step 3: Implement studio aggregation**

Return:

```ts
StudioState
- project
- stages
- currentStage
- references
- acceptedArtifacts
- draftArtifacts
- availableAiActions
- relatedAiJobs
```

Stage labels must be Chinese. Stage IDs stay English.

- [ ] **Step 4: Add API route**

Add:

```ts
GET /api/projects/:id/studio
```

Return 404 with `{ error: "项目不存在" }` when the project is missing.

- [ ] **Step 5: Run studio and app tests**

Run:

```bash
npm test -- server/aggregations/studio.test.ts server/app.test.ts
```

Expected: tests pass.

## Task 4: AI Action Registry and Context Builder

**Files:**
- Create: `server/ai/actionRegistry.ts`
- Create: `server/ai/contextBuilder.ts`
- Create: `server/ai/contextBuilder.test.ts`

- [ ] **Step 1: Write failing tests for available actions**

Test:

```ts
expect(getAvailableActions("image_text", "image_plan").map((action) => action.id)).toContain("generate_image_plan");
expect(getAvailableActions("video", "script").map((action) => action.id)).toContain("generate_script");
```

Test context failure:

```ts
const context = buildActionContext(repository, {
  actionId: "diagnose_video_reference",
  projectId: videoProject.id,
  stage: "diagnosis"
});

expect(context.ok).toBe(false);
expect(context.missingInputs).toContain("需要至少一条视频转写稿 reference");
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- server/ai/contextBuilder.test.ts
```

Expected: fails because modules do not exist.

- [ ] **Step 3: Implement action registry**

Include these nine action IDs:

```ts
generate_topic_angles
diagnose_image_references
generate_image_plan
generate_image_publish_pack
diagnose_video_reference
generate_script
generate_cut_list
generate_video_publish_pack
generate_next_actions
```

Each action defines:

```ts
id
label
contentTypes
stages
outputArtifactType
acceptedTarget
requiredInputs
```

- [ ] **Step 4: Implement context builder**

The context builder returns either:

```ts
{ ok: true, inputSnapshot }
```

or:

```ts
{ ok: false, missingInputs: string[] }
```

Do not call the model when context is insufficient.

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- server/ai/contextBuilder.test.ts
```

Expected: tests pass.

## Task 5: AI Job Runner and Artifact Review Flow

**Files:**
- Create: `server/ai/modelClient.ts`
- Create: `server/ai/promptBuilder.ts`
- Create: `server/ai/aiJobRunner.ts`
- Create: `server/ai/aiJobRunner.test.ts`
- Modify: `server/repository.ts`
- Modify: `server/app.ts`

- [ ] **Step 1: Write failing AI job tests**

Test fallback path:

```ts
const job = await runAiJob(repository, {
  actionId: "generate_image_plan",
  projectId: imageProject.id,
  stage: "image_plan"
}, { apiKey: "", model: "gpt-4.1-mini" });

expect(job.status).toBe("awaiting_review");
const artifacts = repository.listArtifacts(imageProject.id);
expect(artifacts[0]).toMatchObject({
  type: "image_plan",
  source: "ai",
  status: "draft"
});
```

Test accept:

```ts
const accepted = repository.acceptAiJob(job.id);
expect(accepted.status).toBe("accepted");
expect(repository.listArtifacts(imageProject.id)[0].status).toBe("accepted");
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- server/ai/aiJobRunner.test.ts
```

Expected: fails because AI job persistence and runner do not exist.

- [ ] **Step 3: Add AI job repository methods**

Implement:

```ts
createAiJob(input)
updateAiJob(job)
listAiJobs(filter?)
getAiJob(id)
acceptAiJob(id)
rejectAiJob(id)
```

Accepting a job accepts its `outputArtifactId`. Rejecting archives its artifact.

- [ ] **Step 4: Implement model client**

`modelClient.ts` must:

- Use OpenAI when `apiKey` is present.
- Return Chinese structured fallback when `apiKey` is absent.
- Return an object that can create an artifact:

```ts
{
  title: string;
  content: string;
  structuredData: Record<string, unknown>;
}
```

- [ ] **Step 5: Implement runner**

`runAiJob` lifecycle:

```text
create queued job
update running
build context
if context missing -> failed with Chinese error
call model client
create draft artifact
update awaiting_review with outputArtifactId
return job
```

- [ ] **Step 6: Add API routes**

Add:

```text
GET  /api/ai/jobs
POST /api/ai/jobs
POST /api/ai/jobs/:id/accept
POST /api/ai/jobs/:id/reject
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm test -- server/ai/aiJobRunner.test.ts server/app.test.ts
```

Expected: tests pass.

## Task 6: Frontend App Shell and API Clients

**Files:**
- Modify: `src/api.ts`
- Modify: `src/types.ts`
- Create: `src/app/AppShell.tsx`
- Create: `src/app/AppShell.test.tsx`
- Modify: `src/main.tsx`
- Keep temporarily: `src/App.tsx`

- [ ] **Step 1: Write failing AppShell test**

Test:

```tsx
render(<AppShell />);
expect(await screen.findByText("工作台")).toBeInTheDocument();
expect(screen.getByText("素材库")).toBeInTheDocument();
expect(screen.getByText("发布日历")).toBeInTheDocument();
expect(screen.getByText("复盘库")).toBeInTheDocument();
```

Mock `/api/workbench` with a minimal workbench state.

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- src/app/AppShell.test.tsx
```

Expected: fails because AppShell does not exist.

- [ ] **Step 3: Implement API clients**

Add client methods:

```ts
getWorkbench()
getStudio(projectId)
createProject(input)
createReference(input)
createAiJob(input)
acceptAiJob(id)
rejectAiJob(id)
```

- [ ] **Step 4: Implement AppShell**

AppShell renders:

- left navigation
- workbench page as default view
- right AI queue panel

Keep routing in local state for the first version:

```ts
type ActiveView =
  | { name: "workbench" }
  | { name: "studio"; projectId: string };
```

- [ ] **Step 5: Update `src/main.tsx`**

Render `AppShell` instead of the old `App`.

- [ ] **Step 6: Run AppShell test**

Run:

```bash
npm test -- src/app/AppShell.test.tsx
```

Expected: test passes.

## Task 7: Workbench UI

**Files:**
- Create: `src/app/WorkbenchPage.tsx`
- Create: `src/features/projects/ProjectPipeline.tsx`
- Create: `src/features/projects/ProjectCard.tsx`
- Create: `src/features/projects/ProjectCreateDialog.tsx`
- Create: `src/app/WorkbenchPage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing workbench UI test**

Mock `WorkbenchState` with projects in multiple columns.

Assert:

```tsx
expect(await screen.findByText("选题池")).toBeInTheDocument();
expect(screen.getByText("对标/素材")).toBeInTheDocument();
expect(screen.getByText("草稿/脚本")).toBeInTheDocument();
expect(screen.getByText("制作/剪辑")).toBeInTheDocument();
expect(screen.getByText("待发布")).toBeInTheDocument();
expect(screen.getByText("AI 图文选题")).toBeInTheDocument();
expect(screen.getByText("补充对标素材")).toBeInTheDocument();
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- src/app/WorkbenchPage.test.tsx
```

Expected: fails because workbench components do not exist.

- [ ] **Step 3: Implement ProjectCard**

Card shows:

- title
- type label: 图文 or 视频
- platforms
- nextAction
- reference count
- artifact count
- AI state
- blockedReason when present

- [ ] **Step 4: Implement ProjectPipeline**

Render six fixed columns from `WorkbenchState.columns`.

- [ ] **Step 5: Implement create dialog**

Dialog fields:

```text
类型
标题
平台
内容支柱
目标用户
内容承诺
创建位置
```

The first version can use a simple conditional panel instead of a modal library.

- [ ] **Step 6: Run workbench UI test**

Run:

```bash
npm test -- src/app/WorkbenchPage.test.tsx
```

Expected: test passes.

## Task 8: AI Queue Panel UI

**Files:**
- Create: `src/features/ai/AiQueuePanel.tsx`
- Create: `src/features/ai/AiJobCard.tsx`
- Create: `src/features/ai/AiActionList.tsx`
- Create: `src/features/ai/AiQueuePanel.test.tsx`
- Modify: `src/app/AppShell.tsx`

- [ ] **Step 1: Write failing AI queue test**

Mock queue:

```tsx
expect(screen.getByText("正在运行")).toBeInTheDocument();
expect(screen.getByText("等待确认")).toBeInTheDocument();
expect(screen.getByText("可执行动作")).toBeInTheDocument();
expect(screen.getByText("生成图片页规划")).toBeInTheDocument();
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- src/features/ai/AiQueuePanel.test.tsx
```

Expected: fails because components do not exist.

- [ ] **Step 3: Implement AI queue panel**

Render:

- running jobs
- awaiting review jobs
- failed jobs
- available actions

Each awaiting job has:

```text
接受
废弃
```

- [ ] **Step 4: Wire accept/reject callbacks**

Callbacks call API and refresh workbench or studio state.

- [ ] **Step 5: Run AI queue test**

Run:

```bash
npm test -- src/features/ai/AiQueuePanel.test.tsx
```

Expected: test passes.

## Task 9: Production Studio UI

**Files:**
- Create: `src/app/ProductionStudioPage.tsx`
- Create: `src/features/studio/StageNavigator.tsx`
- Create: `src/features/studio/StageEditor.tsx`
- Create: `src/features/studio/ImageTextStudio.tsx`
- Create: `src/features/studio/VideoStudio.tsx`
- Create: `src/app/ProductionStudioPage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing studio UI tests**

Image-text test:

```tsx
expect(await screen.findByText("选题定义")).toBeInTheDocument();
expect(screen.getByText("标题与封面")).toBeInTheDocument();
expect(screen.getByText("图片页规划")).toBeInTheDocument();
```

Video test:

```tsx
expect(await screen.findByText("对标视频")).toBeInTheDocument();
expect(screen.getByText("ASR 转写")).toBeInTheDocument();
expect(screen.getByText("口播稿")).toBeInTheDocument();
expect(screen.getByText("剪辑计划")).toBeInTheDocument();
```

- [ ] **Step 2: Run test and confirm it fails**

Run:

```bash
npm test -- src/app/ProductionStudioPage.test.tsx
```

Expected: fails because studio components do not exist.

- [ ] **Step 3: Implement StageNavigator**

Render stage list with current stage highlighted.

- [ ] **Step 4: Implement StageEditor**

For current stage render:

- stage description
- references related to the project
- accepted artifacts
- draft artifacts
- available AI actions

Use plain textarea inputs for manual notes in the first version. Each textarea
has a stable label, a saved value, and an explicit save action.

- [ ] **Step 5: Implement ImageTextStudio and VideoStudio wrappers**

These choose stage copy and empty-state guidance based on project type.

- [ ] **Step 6: Wire action buttons**

Clicking an AI action creates an AI job and refreshes studio state.

- [ ] **Step 7: Run studio UI test**

Run:

```bash
npm test -- src/app/ProductionStudioPage.test.tsx
```

Expected: test passes.

## Task 10: End-to-End Browser Verification

**Files:**
- Modify: `README.md`
- No new production files unless verification exposes bugs.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Start local app**

Run:

```bash
npm run dev
```

Expected:

```text
Vite available at http://127.0.0.1:5173/
API available at http://127.0.0.1:4317
```

- [ ] **Step 4: Verify image-text loop in browser**

Manual browser flow:

```text
Open workbench
Create image-text project
Add two references
Run diagnose image references
Accept diagnosis artifact
Run generate image plan
Accept image_plan artifact
Run generate image publish pack
Accept publish_pack artifact
Confirm card nextAction and status update
```

- [ ] **Step 5: Verify video loop in browser**

Manual browser flow:

```text
Create video project
Add transcript reference
Run diagnose video reference
Accept diagnosis artifact
Run generate script
Accept script artifact
Run generate cut list
Accept cut_list artifact
Confirm card appears in production or ready column
```

- [ ] **Step 6: Update README**

Document:

- workbench page
- production studio
- AI queue review flow
- local fallback behavior
- current deferred features

- [ ] **Step 7: Final status check**

Run:

```bash
git status --short
```

Expected: only intentional files changed.

## Self-Review Checklist

- Spec coverage:
  - Workbench pipeline: Task 2 and Task 7.
  - Production studio: Task 3 and Task 9.
  - AI queue: Task 5 and Task 8.
  - Data model: Task 1.
  - References and artifacts: Task 1, Task 3, Task 5.
  - Browser verification: Task 10.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps should remain.
- Type consistency:
  - `workflowStatus` uses `idea | reference | draft | production | ready | published | reviewed`.
  - `currentStage` is a string stage id.
  - AI job status uses `queued | running | awaiting_review | accepted | rejected | failed`.
  - Artifact status uses `draft | accepted | archived`.
