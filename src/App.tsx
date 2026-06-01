import {
  BrainCircuit,
  CalendarDays,
  Clapperboard,
  FileText,
  Image,
  Layers3,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Target,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type {
  AiAction,
  AiRunResult,
  ContentProject,
  ContentType,
  WorkflowTemplate
} from "./types";

const seededTweetReference = {
  platform: "X",
  title: "真人出镜 AI 自媒体视频工作流",
  url: "https://x.com/gengdaJ/status/2060682526772150765",
  notes:
    "流程：采集对标视频，用 ASR 转写，诊断内容，手写口播稿，诊断草稿，用 FocuSee 录制，按转写稿粗剪，最后导入剪映精剪。"
};

const actionOptions: Array<{ value: AiAction; label: string }> = [
  { value: "ideate", label: "生成选题" },
  { value: "diagnose_reference", label: "诊断对标" },
  { value: "draft", label: "生成草稿" },
  { value: "optimize", label: "优化内容" },
  { value: "repurpose", label: "内容复用" },
  { value: "publish_pack", label: "发布包" },
  { value: "retrospective", label: "复盘" }
];

const statusLabels: Record<ContentProject["workflowStatus"], string> = {
  idea: "想法",
  reference: "对标/素材",
  draft: "草稿",
  production: "制作中",
  ready: "待发布",
  published: "已发布",
  reviewed: "已复盘"
};

function App() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [selectedType, setSelectedType] = useState<ContentType>("image_text");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [aiAction, setAiAction] = useState<AiAction>("ideate");
  const [aiNotes, setAiNotes] = useState("");
  const [aiResult, setAiResult] = useState<AiRunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTemplate = templates.find(
    (template) => template.type === selectedType
  );
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );
  const displayedAssets = selectedTemplate?.assetDefaults || [];
  const displayedChecklist = selectedTemplate?.checklist || [];

  useEffect(() => {
    let mounted = true;

    Promise.all([api.templates(), api.projects()])
      .then(([templateData, projectData]) => {
        if (!mounted) {
          return;
        }

        setTemplates(templateData);
        setProjects(projectData);
        setSelectedProjectId(projectData[0]?.id || "");
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "工作台加载失败"
        );
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const workflowMetrics = useMemo(
    () => [
      {
        label: "进行中项目",
        value: projects.length || 0
      },
      {
        label: "图文生产线",
        value: projects.filter((project) => project.type === "image_text")
          .length
      },
      {
        label: "视频生产线",
        value: projects.filter((project) => project.type === "video").length
      }
    ],
    [projects]
  );

  const createProject = async (type: ContentType) => {
    setError("");
    const isVideo = type === "video";
    const created = await api.createProject({
      type,
      title: isVideo ? "真人出镜 AI 视频生产线" : "AI 图文内容生产线",
      contentPillar: isVideo ? "AI video workflow" : "AI image-copy workflow",
      platforms: isVideo ? ["抖音", "小红书"] : ["小红书", "公众号"],
      targetAudience: "正在搭建稳定内容系统的个人创作者",
      promise: isVideo
        ? "用对标和 ASR 稳定产出视频"
        : "用对标和图片页规划稳定产出图文",
      goal: isVideo
        ? "产出一条由对标驱动的视频，包含口播稿、录制计划和剪辑清单"
        : "产出一篇值得收藏的图文，包含封面、图片页、正文和发布文案"
    });

    setProjects((current) => [created, ...current]);
    setSelectedType(type);
    setSelectedProjectId(created.id);
  };

  const runAi = async () => {
    if (!selectedProject) {
      return;
    }

    setAiLoading(true);
    setError("");
    setAiResult(null);

    try {
      const result = await api.runAi({
        action: aiAction,
        projectId: selectedProject.id,
        userNotes:
          aiNotes ||
          `参考这个对标内容：${seededTweetReference.title}。${seededTweetReference.notes}`
      });
      setAiResult(result);
    } catch (requestError) {
      setError(
          requestError instanceof Error
            ? requestError.message
          : "AI 动作执行失败"
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Workspace summary">
        <div>
          <p className="eyebrow">How To Media</p>
          <h1>AI 原生自媒体生产工作台</h1>
          <p className="lede">
            一个本地运行的内容生产系统，覆盖图文和视频两条路线。核心不是简单写稿，
            而是把对标诊断、AI 评审、草稿生成、内容复用、发布包和复盘串成稳定流程。
          </p>
        </div>

        <div className="metric-strip">
          {workflowMetrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace-grid">
        <aside className="panel side-panel">
          <div className="panel-heading">
            <span>工作流模式</span>
            <Layers3 size={18} />
          </div>

          <div className="switcher" role="tablist" aria-label="内容类型">
            <button
              className={selectedType === "image_text" ? "active" : ""}
              onClick={() => setSelectedType("image_text")}
              type="button"
            >
              <Image size={16} />
              图文
            </button>
            <button
              className={selectedType === "video" ? "active" : ""}
              onClick={() => setSelectedType("video")}
              type="button"
            >
              <Clapperboard size={16} />
              视频
            </button>
          </div>

          <div className="create-actions">
            <button type="button" onClick={() => createProject("image_text")}>
              <Plus size={16} />
              新建图文项目
            </button>
            <button type="button" onClick={() => createProject("video")}>
              <Plus size={16} />
              新建视频项目
            </button>
          </div>

          <div className="template-summary">
            <div className="section-label">AI 模板</div>
            {templates.map((template) => (
              <button
                className="template-chip"
                key={template.id}
                onClick={() => setSelectedType(template.type)}
                type="button"
              >
                <span>{template.name}</span>
                <small>{template.stages.length} 个阶段</small>
              </button>
            ))}
          </div>

          <div className="project-list">
            <div className="section-label">项目</div>
            {loading ? (
              <div className="skeleton-list">
                <span />
                <span />
                <span />
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                新建一个项目后，就可以开始沉淀对标内容、AI 诊断和生产简报。
              </div>
            ) : (
              projects.map((project) => (
                <button
                  className={
                    project.id === selectedProjectId
                      ? "project-item selected"
                      : "project-item"
                  }
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setSelectedType(project.type);
                  }}
                  type="button"
                >
                  <span>{project.title}</span>
                  <small>{statusLabels[project.workflowStatus]}</small>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="panel main-panel">
          <div className="panel-heading">
            <span>{selectedTemplate?.name || "工作流模板"}</span>
            {selectedType === "video" ? (
              <Clapperboard size={18} />
            ) : (
              <FileText size={18} />
            )}
          </div>

          <div className="workflow-hero">
            <div>
              <p className="eyebrow">
                {selectedType === "video"
                  ? "从对标到最终剪辑"
                  : "从对标到可发布图文"}
              </p>
              <h2>
                {selectedType === "video"
                  ? "把对标视频转化为口播稿、录制计划和剪辑清单。"
                  : "把对标图文转化为图片规划、正文和发布包。"}
              </h2>
            </div>
            <div className="tweet-source">
              <Target size={18} />
              <span>种子流程来自 gengdaJ 在 2026-05-30 发布的 X 推文</span>
            </div>
          </div>

          <div className="stage-grid">
            {(selectedTemplate?.stages || []).map((stage, index) => (
              <div className="stage-card" key={stage}>
                <span className="stage-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{stage}</strong>
                <p>{stageDescription(stage, selectedType)}</p>
              </div>
            ))}
          </div>

          <div className="production-columns">
            <div>
              <div className="section-label">默认素材</div>
              <div className="asset-list">
                {displayedAssets.map((asset) => (
                  <div className="asset-row" key={asset.id}>
                    <span>{asset.title}</span>
                    <small>{asset.purpose}</small>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label">生产检查</div>
              <ul className="check-list">
                {displayedChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <aside className="panel ai-panel">
          <div className="panel-heading">
            <span>AI 指令台</span>
            <BrainCircuit size={18} />
          </div>

          <label className="field">
            <span>动作</span>
            <select
              value={aiAction}
              onChange={(event) => setAiAction(event.target.value as AiAction)}
            >
              {actionOptions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>上下文备注</span>
            <textarea
              value={aiNotes}
              onChange={(event) => setAiNotes(event.target.value)}
              placeholder="粘贴对标笔记、评论问题、转写片段、草稿疑虑或发布限制。"
            />
          </label>

          <button
            className="primary-action"
            disabled={!selectedProject || aiLoading}
            onClick={runAi}
            type="button"
          >
            {aiLoading ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
            运行 AI 工作流
          </button>

          <div className="ai-result">
            {!aiResult ? (
              <div className="empty-state">
                选择一个项目并运行 AI 动作。没有配置 API Key 时，后端会返回结构化离线策略，
                让工作流仍然可以使用。
              </div>
            ) : (
              <>
                <div className="result-summary">
                  <Sparkles size={17} />
                  <span>{aiResult.summary}</span>
                </div>
                {aiResult.sections.map((section) => (
                  <div className="result-section" key={section.title}>
                    <strong>{section.title}</strong>
                    <p>{section.body}</p>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>
      </section>

      <section className="bottom-band">
        <div>
          <CalendarDays size={18} />
          <span>下一步建设目标：持久化编辑器、Markdown 导出、对标采集、ASR 导入和 Obsidian 生产简报。</span>
        </div>
        <div>
          <Play size={18} />
          <span>AI 原生意味着每个阶段都可以被生成、诊断、复用和衡量。</span>
        </div>
      </section>
    </main>
  );
}

function isLegacyEnglishText(value: string) {
  return /[A-Za-z]{4,}/.test(value);
}

function stageDescription(stage: string, type: ContentType) {
  const descriptions: Record<string, string> = {
    内容支柱校准: "检查选题是否符合长期内容支柱、目标用户和账号目标。",
    对标研究: "收集已经验证过的标题、封面、结构、图片样式和评论问题。",
    对标诊断: "提取开头、承诺、结构、视觉模式和可复用的内容张力。",
    图片规划: "给每张图分配任务：封面、背景、框架、案例、清单或 CTA。",
    正文草稿: "撰写正文、标题候选、平台发布文案、标签和关键词。",
    "AI 诊断优化": "在设计、录制或发布前，做一次明确的 AI 诊断和改写。",
    发布包: "打包标题、素材、正文、标签、发布检查和后续评论引导。",
    复盘: "把数据和评论沉淀为新对标、新选题和下一步动作。",
    对标视频采集: "从抖音、小红书或相邻平台采集可分析的对标视频。",
    "ASR 转写": "把音频转成文本，让 AI 可以诊断开头、节奏、证据和结构。",
    视频诊断: "分析视频有效之处：开头、叙事、节奏、证据、画面和 CTA。",
    口播稿草稿: "写出能自然说出来的口播稿，保留创作者自己的判断。",
    口播稿诊断: "录制前检查口播稿的清晰度、证据、节奏和真人表达感。",
    录制: "准备 FocuSee、OBS 或相机设置，检查场景、麦克风和素材。",
    粗剪: "基于转写稿删掉停顿、重复、弱表达和多余段落。",
    最终剪辑: "完成字幕、强调文字、B-roll、封面、音频和平台导出。"
  };

  return (
    descriptions[stage] ||
    (type === "video"
      ? "把视频从对标洞察推进到可录制、可剪辑的生产资产。"
      : "把图文从对标洞察推进到可发布的图片和正文资产。")
  );
}

export default App;
