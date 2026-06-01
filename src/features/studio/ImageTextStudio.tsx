import type { StudioState } from "../../types";
import { StageEditor } from "./StageEditor";
import { StageNavigator } from "./StageNavigator";

export interface ImageTextStudioProps {
  studio: StudioState;
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  onReferenceCreated?: () => Promise<void> | void;
  onRunAction?: (actionId: string) => Promise<void> | void;
}

const guidanceByStage: Record<string, string> = {
  topic: "明确选题、目标用户、痛点和内容承诺。",
  references: "整理图文对标素材、标题、封面和评论问题。",
  diagnosis: "提炼对标内容的结构、风险和可复用模式。",
  title_cover: "产出标题候选、封面主标题和视觉方向。",
  image_plan: "规划每一页图片的任务、文案和素材。",
  body_caption: "整理正文、平台文案、标签和评论引导。",
  publish_pack: "检查标题、封面、图片页、正文和发布文案。",
  retrospective: "记录数据、评论洞察、经验和下一批选题。"
};

export function ImageTextStudio({
  studio,
  selectedStageId,
  onSelectStage,
  onReferenceCreated,
  onRunAction
}: ImageTextStudioProps) {
  const selectedStage =
    studio.stages.find((stage) => stage.id === selectedStageId) ??
    studio.currentStage;

  return (
    <div className="studio-body">
      <StageNavigator
        currentStageId={studio.currentStage.id}
        onSelectStage={onSelectStage}
        selectedStageId={selectedStage.id}
        stages={studio.stages}
      />
      <StageEditor
        guidance={guidanceByStage[selectedStage.id] ?? "推进当前图文生产阶段。"}
        onReferenceCreated={onReferenceCreated}
        onRunAction={onRunAction}
        stage={selectedStage}
        studio={studio}
      />
    </div>
  );
}
