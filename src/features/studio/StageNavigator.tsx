import type { StudioStage } from "../../types";

export interface StageNavigatorProps {
  stages: StudioStage[];
  currentStageId: string;
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
}

export function StageNavigator({
  stages,
  currentStageId,
  selectedStageId,
  onSelectStage
}: StageNavigatorProps) {
  return (
    <nav className="stage-navigator" aria-label="生产阶段">
      {stages.map((stage) => (
        <button
          className={stage.id === selectedStageId ? "selected" : ""}
          key={stage.id}
          onClick={() => onSelectStage(stage.id)}
          type="button"
        >
          <span>{stage.label}</span>
          {stage.id === currentStageId ? <small>当前</small> : null}
        </button>
      ))}
    </nav>
  );
}
