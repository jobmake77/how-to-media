# How To Media

How To Media 是一个本地运行的 AI 原生自媒体生产工作台。它把图文和视频内容拆成可追踪的生产状态、单项目生产舱、AI 任务队列和可审核的 AI 产物，目标是让创作者按生产流水线推进内容，而不是停留在一次性 prompt。

当前应用包含三块核心界面：

- 工作台：按状态展示项目流水线、摘要指标、项目卡片和新建项目入口。
- 生产舱：打开单个项目后，按内容类型展示阶段导航、输入素材、已确认产物、待确认草稿、人工备注和阶段 AI 动作。
- AI 队列：展示运行中、待确认、失败任务；待确认任务可以接受或废弃，对应接受或归档 AI 生成的 draft artifact。

## 技术栈

- React + Vite
- Express
- SQLite via `better-sqlite3`
- OpenAI Responses API
- Vitest

## 本地启动

```bash
npm install
cp .env.example .env
npm run dev
```

默认地址：

```text
Client: http://127.0.0.1:5173/
API:    http://127.0.0.1:4317
```

如果 `5173` 已被占用，Vite 会自动选择下一个端口，例如 `http://127.0.0.1:5174/`。

## AI 配置

在 `.env` 中配置 OpenAI 后端调用：

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

如果没有配置 `OPENAI_API_KEY`，应用仍可完整运行本地流程。AI job runner 会返回确定性的中文 fallback artifact：

- job 会从 `queued` 进入 `running`
- 上下文满足时创建 draft artifact
- job 进入 `awaiting_review`
- 通过 AI 队列接受或废弃产物

这个 fallback 行为用于本地开发和端到端验证，不会发起网络模型调用。

## 数据

默认 SQLite 数据库路径：

```text
./data/how-to-media.sqlite
```

可以通过环境变量覆盖：

```bash
DATABASE_PATH=/absolute/path/to/how-to-media.sqlite
```

应用启动时会兼容早期项目表结构，并将旧项目数据迁移到当前 production-driven 项目模型。

## 测试和构建

```bash
npm test
npm run build
```

## 当前功能

### 工作台

- 图文和视频项目创建。
- 状态流水线：
  - 选题池
  - 对标/素材
  - 草稿/脚本
  - 制作/剪辑
  - 待发布
  - 已发布
  - 已复盘
- 摘要指标：
  - 项目总数
  - 阻塞项目
  - 待审核
  - 本周待发布
  - AI 运行中
- 项目卡片展示平台、内容支柱、下一步动作、素材数、产物数和 AI 状态。

### 生产舱

图文生产阶段：

- 选题定义
- 对标素材
- AI 诊断
- 标题与封面
- 图片规划
- 正文与发布文案
- 发布包
- 复盘

视频生产阶段：

- 选题定义
- 对标视频
- ASR 转写
- AI 诊断
- 口播脚本
- 录制计划
- 剪辑计划
- 发布包
- 复盘

生产舱会加载项目、阶段、引用素材、已确认产物、待确认草稿和相关 AI jobs。人工备注目前保存在页面本地状态中，不持久化到后端。

### AI 动作和队列

当前后端 action registry 支持：

- 生成选题角度
- 诊断图文对标素材
- 生成图片规划
- 生成图文发布包
- 诊断视频对标转写
- 生成口播脚本
- 生成剪辑清单
- 生成视频发布包
- 生成下一步动作

AI action 会先构建项目上下文并校验必需输入。上下文不足时，job 会进入 `failed`，并在 AI 队列展示中文原因，例如：

```text
需要至少一条视频转写稿 reference
```

上下文满足时，runner 会创建 draft artifact，并把 job 放入待确认队列。接受 job 会接受对应 artifact，废弃 job 会归档对应 artifact。

## API 概览

主要接口：

- `GET /api/workbench`
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `GET /api/projects/:id/studio`
- `GET /api/ai/jobs`
- `POST /api/ai/jobs`
- `POST /api/ai/jobs/:id/accept`
- `POST /api/ai/jobs/:id/reject`

兼容接口：

- `GET /api/templates`
- `POST /api/ai/run`

## 当前限制和后续方向

以下能力仍是明确的 deferred scope：

- 素材库页面和完整 reference 创建/导入 UI。
- 浏览器内上传截图、文件和 ASR 转写稿的完整采集体验。
- 拖拽式项目状态流转。
- 发布日历 UI。
- 复盘库 UI。
- 富文本或结构化编辑器。
- 人工备注持久化。
- 更完整的 artifact accept/reject 详情页。
- 对外发布平台或 Agent Reach 采集集成。

因此，在没有手动插入 reference 数据的情况下，依赖图文对标素材或视频转写稿的 AI 动作会按预期失败，并在 AI 队列展示缺少输入的中文提示。
