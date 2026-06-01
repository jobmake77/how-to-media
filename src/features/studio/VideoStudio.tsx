import type { StudioState } from "../../types";
import { StageEditor } from "./StageEditor";
import { StageNavigator } from "./StageNavigator";

export interface VideoStudioProps {
  studio: StudioState;
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  onReferenceCreated?: () => Promise<void> | void;
  onRunAction?: (actionId: string) => Promise<void> | void;
}

const guidanceByStage: Record<string, string> = {
  topic: "明确视频形式、目标受众、承诺和开头目标。",
  reference_videos: "整理对标视频、作者、结构、封面和评论问题。",
  asr_transcript: "整理参考视频或自有录制的转写稿。",
  diagnosis: "分析 hook、节奏、证据、视觉和 CTA。",
  script: "产出口播开头、完整脚本、视觉提示和字幕重点。",
  recording_plan: "准备录制场景、设备、屏幕窗口和素材清单。",
  edit_plan: "规划粗剪、删除点、字幕、B-roll 和导出要求。",
  publish_pack: "检查标题、封面文案、简介、标签和发布时间。",
  retrospective: "记录播放、完播、互动、评论问题和下一批选题。"
};

export function VideoStudio({
  studio,
  selectedStageId,
  onSelectStage,
  onReferenceCreated,
  onRunAction
}: VideoStudioProps) {
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
        guidance={guidanceByStage[selectedStage.id] ?? "推进当前视频生产阶段。"}
        onReferenceCreated={onReferenceCreated}
        onRunAction={onRunAction}
        stage={selectedStage}
        studio={studio}
      />
    </div>
  );
}
