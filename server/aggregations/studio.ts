import type { AiJob, Artifact, ContentProject, ReferenceItem } from "../domain";
import { listActionDefinitions } from "../ai/actionRegistry";
import type { createDatabase } from "../repository";

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

const imageTextStages: StudioStage[] = [
  {
    id: "topic",
    label: "选题定义",
    description: "明确受众、承诺、平台与内容支柱"
  },
  {
    id: "references",
    label: "对标素材",
    description: "收集并整理图文对标素材"
  },
  {
    id: "diagnosis",
    label: "AI 诊断",
    description: "沉淀可复用结构、风险与定位建议"
  },
  {
    id: "title_cover",
    label: "标题与封面",
    description: "规划标题候选、封面文案与视觉方向"
  },
  {
    id: "image_plan",
    label: "图片规划",
    description: "拆解每页图片的任务、文案与素材需求"
  },
  {
    id: "body_caption",
    label: "正文与发布文案",
    description: "整理正文、平台文案、标签与评论引导"
  },
  {
    id: "publish_pack",
    label: "发布包",
    description: "准备标题、正文、标签、素材清单与发布检查"
  },
  {
    id: "retrospective",
    label: "复盘",
    description: "记录数据、评论洞察、经验与下一批选题"
  }
];

const videoStages: StudioStage[] = [
  {
    id: "topic",
    label: "选题定义",
    description: "明确受众、承诺、平台与内容支柱"
  },
  {
    id: "reference_videos",
    label: "对标视频",
    description: "收集并整理视频对标素材"
  },
  {
    id: "asr_transcript",
    label: "ASR 转写",
    description: "整理参考视频或自有录制的转写文本"
  },
  {
    id: "diagnosis",
    label: "AI 诊断",
    description: "沉淀可复用结构、风险与定位建议"
  },
  {
    id: "script",
    label: "口播脚本",
    description: "产出开头、正文段落、视觉提示与 CTA"
  },
  {
    id: "recording_plan",
    label: "录制计划",
    description: "准备录制场景、设备、素材和检查清单"
  },
  {
    id: "edit_plan",
    label: "剪辑计划",
    description: "规划粗剪、字幕、B-roll、封面和导出要求"
  },
  {
    id: "publish_pack",
    label: "发布包",
    description: "准备标题、正文、标签、素材清单与发布检查"
  },
  {
    id: "retrospective",
    label: "复盘",
    description: "记录数据、评论洞察、经验与下一批选题"
  }
];

export function buildStudioState(
  repository: ReturnType<typeof createDatabase>,
  projectId: string
): StudioState | undefined {
  const project = repository.getProject(projectId);
  if (!project) {
    return undefined;
  }

  const stages = project.type === "video" ? videoStages : imageTextStages;
  const artifacts = repository.listArtifacts(project.id);
  const currentStage =
    stages.find((stage) => stage.id === project.currentStage) ?? stages[0];

  return {
    project,
    stages,
    currentStage,
    references: repository.listReferences(project.id),
    acceptedArtifacts: artifacts.filter((artifact) => artifact.status === "accepted"),
    draftArtifacts: artifacts.filter((artifact) => artifact.status === "draft"),
    availableAiActions: buildAvailableAiActions(project),
    relatedAiJobs: repository.listAiJobs({ projectId: project.id })
  };
}

function buildAvailableAiActions(project: ContentProject): StudioAiAction[] {
  return listActionDefinitions()
    .filter((action) => action.contentTypes.includes(project.type))
    .flatMap((action) =>
      action.stages.map((stage) => ({
        id: action.id,
        label: action.label,
        stage
      }))
    );
}
