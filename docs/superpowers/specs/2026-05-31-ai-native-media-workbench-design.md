# AI Native Media Workbench Design

## Goal

Rebuild the current app from a workflow-template page into a real local
self-media production workbench. The workbench should help a solo creator decide
what to do today, move content cards through production states, open a focused
production studio for a single content item, and use AI as a queue of
reviewable production tasks instead of a one-off button.

## Current Problem

The current page has useful pieces, but the design logic is wrong for daily
production:

- It presents image-text and video templates instead of showing active work.
- It does not answer which content item should be advanced next.
- AI output is shown as a transient result, not as a reviewable artifact.
- Content state, references, drafts, AI output, publish plans, and
  retrospectives are too tightly packed into one project object.
- Image-text and video are treated as top-level modes, but real production
  should be organized by status first and content type second.

The new design must make the workbench status-driven and artifact-driven.

## Product Architecture

Use three coordinated surfaces:

```text
App Shell
├─ Left navigation
│  ├─ Workbench
│  ├─ Reference Library
│  ├─ Publishing Calendar
│  ├─ Retrospectives
│  └─ Settings
│
├─ Main area
│  ├─ Workbench Page: status pipeline
│  └─ Production Studio Page: one content item
│
└─ Right panel
   └─ AI Queue / AI collaboration layer
```

The home page is organized by content status:

```text
Idea Pool -> References/Assets -> Draft/Script -> Production/Edit -> Ready -> Published/Review
```

Image-text and video projects both live in this pipeline. Type-specific
differences appear on cards and inside the production studio.

## Workbench Page

The workbench page answers one question: what should be advanced today?

### Layout

```text
Top summary
├─ Priority today
├─ Blocked items
├─ Awaiting review
├─ Publishing this week
└─ AI running

Main
├─ Left navigation
├─ Status pipeline
└─ AI Queue
```

### Pipeline Columns

The first version uses fixed columns:

```text
Idea Pool
References/Assets
Draft/Script
Production/Edit
Ready
Published/Review
```

No drag-and-drop is required in the first version. Status can be changed with
explicit actions.

### Content Card Fields

Each card shows production-relevant information:

- Title
- Type: image-text or video
- Platforms
- Content pillar
- Workflow status
- Current stage
- Next action
- Blocked reason, when present
- AI state: actionable, running, awaiting review, failed
- Asset summary: reference count, transcript count, artifact count
- Publish date or deadline
- Priority

Cards should not show long drafts or full AI output. The home page is for
scheduling and triage.

### Workbench Actions

The workbench supports:

- Create project
- Import reference
- Open project studio
- Move project to next status
- Run recommended AI batch action
- Filter by type, platform, pillar, AI state, blocked state, or publish window

Creating a project uses a small flow:

```text
1. Choose type: image-text or video
2. Enter title or seed idea
3. Choose platforms
4. Choose content pillar
5. Define target audience and content promise
6. Create in Idea Pool or References/Assets
```

Importing a reference creates a `ReferenceItem`; it does not always create a
project. The user can later attach it to an existing project or create a project
from it.

## Production Studio

Clicking a card opens the production studio. The studio focuses on one content
item and moves it from inputs to publishable outputs.

### Layout

```text
Project header
├─ Title
├─ Type
├─ Platforms
├─ Workflow status
├─ Current stage
├─ Next action
└─ Publish plan

Studio body
├─ Stage navigator
├─ Stage editor / artifact area
└─ AI collaboration panel
```

Each stage has four areas:

```text
Input area -> AI actions -> Artifacts -> Confirmation
```

AI output is never written directly into the final project fields. It first
becomes a draft artifact. The user accepts or rejects it.

### Image-Text Stages

```text
Topic Definition
References
AI Diagnosis
Title and Cover
Image Plan
Body and Caption
Publish Pack
Retrospective
```

Stage details:

- Topic Definition: title, audience, pain, promise, pillar, platforms, success
  criteria.
- References: benchmark links, screenshots, titles, cover descriptions, image
  count, body structure, comment questions, metrics.
- AI Diagnosis: common patterns, reusable structure, risks, positioning advice,
  what not to copy.
- Title and Cover: title candidates, cover headline, subcopy, visual direction,
  A/B directions.
- Image Plan: each image page has a job, title, copy, visual format, required
  assets, and status.
- Body and Caption: body copy, platform caption, tags, comment prompt, platform
  variants.
- Publish Pack: title, cover copy, image list, body, caption, tags, preflight
  checks, Markdown export.
- Retrospective: metrics, comment insights, learnings, next ideas.

### Video Stages

```text
Topic Definition
Reference Videos
ASR Transcript
AI Diagnosis
Script
Recording Plan
Edit Plan
Publish Pack
Retrospective
```

Stage details:

- Topic Definition: video format, audience, promise, target duration, opening
  goal, screen or product requirements.
- Reference Videos: links, platform, author, title, duration, metrics, cover,
  comments, download/transcript status.
- ASR Transcript: reference transcripts, own recording transcripts, timeline,
  highlights, weak lines, strong lines.
- AI Diagnosis: hook, promise, structure, rhythm, proof, visuals, emotion, CTA,
  reusable patterns, risks.
- Script: opening 3 seconds, full spoken script, sections, visual cues, subtitle
  highlights, expected duration, versions.
- Recording Plan: tool, scene, microphone, camera, screen windows, assets,
  checklist, file path.
- Edit Plan: rough cut list, deletion markers, retained segments, subtitle
  emphasis, B-roll, screenshots, audio, cover, export settings.
- Publish Pack: platform title, cover copy, description, tags, comment prompt,
  publish time, export file, preflight checks.
- Retrospective: plays, completion rate, watch time, likes, saves, comments,
  shares, follows, comment questions, next topic.

## AI Queue

The AI queue is a production task layer, not a chat box.

It answers:

- What is AI doing now?
- What AI outputs need human review?
- What can AI do on this page?
- What should be advanced today?

### Home Page AI Queue

On the workbench page, the queue is operational:

```text
Running
Awaiting review
Available batch actions
Today suggestions
```

Examples:

- Diagnose 3 benchmark image-text references.
- Generate 2 video script drafts.
- Review 5 title candidates.
- Generate captions for ready items.
- Create next topic batch from comment insights.

### Studio AI Panel

Inside a project, the queue is stage-aware:

```text
Current stage
Available actions
Context summary
Draft outputs
Confirm / reject actions
```

AI actions are not a global dropdown. They are derived from project type,
current stage, and available inputs.

### AI Job Lifecycle

```text
User starts AI action
    -> Create AiJob(status=queued)
    -> Build input snapshot
    -> Run model or fallback(status=running)
    -> Create draft Artifact
    -> AiJob(status=awaiting_review)
    -> User accepts or rejects
    -> Artifact(status=accepted|archived)
    -> AiJob(status=accepted|rejected)
    -> Project nextAction/status updates when appropriate
```

This preserves user judgment and prevents AI output from silently overwriting
project content.

## Data Model

The first version should move from template-driven data to production-driven
data.

### ContentProject

```text
ContentProject
- id
- type: image_text | video
- title
- contentPillar
- platforms[]
- workflowStatus:
  - idea
  - reference
  - draft
  - production
  - ready
  - published
  - reviewed
- currentStage
- nextAction
- blockedReason
- priority: low | normal | high
- targetAudience
- promise
- goal
- publishAt
- createdAt
- updatedAt
```

`workflowStatus` controls the workbench column. `currentStage` controls the
production studio stage.

### ReferenceItem

```text
ReferenceItem
- id
- projectId, nullable
- sourceType: url | file | note | transcript | comment
- contentType: image_text | video | mixed
- platform
- url
- title
- author
- rawText
- transcript
- screenshots[]
- metrics
- notes
- status: collected | transcribed | diagnosed | used
- createdAt
- updatedAt
```

References can exist without a project. This allows a real reference library.

### Artifact

```text
Artifact
- id
- projectId
- type:
  - brief
  - diagnosis
  - title_set
  - cover_plan
  - image_plan
  - body_copy
  - caption
  - transcript
  - script
  - storyboard
  - recording_plan
  - cut_list
  - publish_pack
  - retrospective
- stage
- title
- content
- structuredData
- source: human | ai | imported
- version
- status: draft | accepted | archived
- createdAt
- updatedAt
```

Artifacts make AI output reviewable and versionable.

### AiJob

```text
AiJob
- id
- projectId, nullable
- stage, nullable
- action
- scope: global | project | stage
- status:
  - queued
  - running
  - awaiting_review
  - accepted
  - rejected
  - failed
- inputSnapshot
- output
- outputArtifactId, nullable
- acceptedTarget, nullable
- error
- createdAt
- updatedAt
```

### PublishPlan

```text
PublishPlan
- id
- projectId
- platform
- scheduledAt
- status: planned | ready | published | skipped
- title
- caption
- tags[]
- assetChecklist[]
- publishedUrl
- createdAt
- updatedAt
```

### Retrospective

```text
Retrospective
- id
- projectId
- platform
- metrics
  - views
  - reads
  - likes
  - saves
  - comments
  - shares
  - followers
  - completionRate
  - averageWatchTime
- commentInsights[]
- learnings
- nextIdeas[]
- createdAt
```

## Backend API

The API should expose resource endpoints and two aggregation endpoints.

### Aggregation Endpoints

```text
GET /api/workbench
```

Returns:

```text
WorkbenchState
- summary
- columns[]
- aiQueue
- filters
```

```text
GET /api/projects/:id/studio
```

Returns:

```text
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

### Resource Endpoints

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
PATCH  /api/projects/:id/status

GET    /api/projects/:id/references
POST   /api/projects/:id/references
POST   /api/references
PATCH  /api/references/:id

GET    /api/projects/:id/artifacts
POST   /api/projects/:id/artifacts
PATCH  /api/artifacts/:id
POST   /api/artifacts/:id/accept
POST   /api/artifacts/:id/archive

GET    /api/ai/jobs
POST   /api/ai/jobs
GET    /api/ai/jobs/:id
POST   /api/ai/jobs/:id/accept
POST   /api/ai/jobs/:id/reject
POST   /api/ai/jobs/:id/retry

GET    /api/projects/:id/publish-plans
POST   /api/projects/:id/publish-plans
PATCH  /api/publish-plans/:id

GET    /api/projects/:id/retrospectives
POST   /api/projects/:id/retrospectives
```

## AI Backend Design

AI logic should be split into focused modules:

```text
server/ai/
├─ actionRegistry.ts
├─ contextBuilder.ts
├─ promptBuilder.ts
├─ modelClient.ts
└─ aiJobRunner.ts
```

Responsibilities:

- `actionRegistry`: define stage-specific actions, required inputs, output
  artifact type, and accepted target.
- `contextBuilder`: extract only the context needed for the selected action and
  report missing inputs.
- `promptBuilder`: create model prompts and structured output schemas.
- `modelClient`: call OpenAI or return fallback output, then validate shape.
- `aiJobRunner`: create jobs, update status, create artifacts, handle failure
  and retries.

## First Version Scope

The first implementation should complete the real workbench loop without
overbuilding.

### Must Have

- Status pipeline workbench with six fixed columns.
- Project creation flow with type, title, platforms, pillar, audience, promise,
  and starting status.
- Content cards with next action, AI state, reference/artifact summary, blocked
  state, priority, and publish date.
- Production studio with left stage navigation, central stage content, and right
  AI collaboration panel.
- Reference creation and attachment to projects.
- Artifact model with draft, accepted, and archived statuses.
- AI job queue with synchronous execution, draft artifact creation, accept, and
  reject.
- `GET /api/workbench` and `GET /api/projects/:id/studio`.
- Nine core AI actions:
  - image-text: generate topic angles
  - image-text: diagnose references
  - image-text: generate image plan
  - image-text: generate publish pack
  - video: diagnose reference transcript
  - video: generate script
  - video: generate cut list
  - video: generate publish pack
  - shared: generate next action suggestions

### Defer

- Drag-and-drop Kanban.
- Automatic platform scraping.
- File uploads and screenshot storage.
- Background worker.
- Multi-user collaboration.
- Permissions.
- Full publishing calendar.
- Analytics dashboards.
- Rich text editor.
- Obsidian filesystem sync.
- Automatic comment scraping.
- Deep Agent Reach integration.
- Auto-publishing.
- Version diff.
- Multi-model selector UI.

## Success Criteria

### Image-Text Loop

```text
Create image-text project
-> Add two references
-> Run reference diagnosis
-> Accept diagnosis artifact
-> Run image plan generation
-> Accept image_plan artifact
-> Run publish pack generation
-> Accept publish_pack artifact
-> Project appears in Ready column
```

### Video Loop

```text
Create video project
-> Add one transcript reference
-> Run transcript diagnosis
-> Accept diagnosis artifact
-> Run script generation
-> Accept script artifact
-> Run cut list generation
-> Accept cut_list artifact
-> Project appears in Production/Edit or Ready column
```

### Workbench Loop

```text
Workbench shows projects in different status columns
AI queue shows awaiting review items
Accepting an AI artifact updates the queue
Project card nextAction updates
```

## Implementation Order

Implementation should not start with UI. Recommended order:

1. SQLite schema and migrations.
2. Repository tests for projects, references, artifacts, and AI jobs.
3. Workbench aggregation endpoint.
4. Studio aggregation endpoint.
5. AI job and artifact flow.
6. Workbench UI.
7. Production studio UI.
8. Browser verification for image-text and video loops.

## Notes

- The existing X post from `gengdaJ` remains the seed reference for the video
  workflow.
- The UI language should remain Chinese.
- Code, identifiers, comments, and commit messages should remain English unless
  modifying already Chinese documentation.
- The system is local-first and single-user in the first version.
