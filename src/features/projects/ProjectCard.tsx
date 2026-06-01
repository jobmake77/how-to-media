import type { WorkbenchCard } from "../../types";

export interface ProjectCardProps {
  card: WorkbenchCard;
  onOpen?: (projectId: string) => void;
}

const aiStateLabels: Record<WorkbenchCard["aiState"], string> = {
  idle: "空闲",
  actionable: "可推进",
  running: "运行中",
  awaiting_review: "待审核",
  failed: "失败"
};

export function ProjectCard({ card, onOpen }: ProjectCardProps) {
  return (
    <button
      className="project-card"
      onClick={() => onOpen?.(card.id)}
      type="button"
    >
      <div className="project-card-topline">
        <span className="type-pill">
          {card.type === "image_text" ? "图文" : "视频"}
        </span>
        <span className={`ai-state ai-state-${card.aiState}`}>
          {aiStateLabels[card.aiState]}
        </span>
      </div>

      <h3>{card.title}</h3>
      <p className="project-next-action">{card.nextAction || "暂无下一步"}</p>

      <div className="project-meta-line">
        <span>{card.platforms.join("、")}</span>
        <span>{card.contentPillar}</span>
      </div>

      <div className="project-counts">
        <span>素材 {card.referenceCount}</span>
        <span>产物 {card.artifactCount}</span>
      </div>

      {card.blockedReason ? (
        <div className="blocked-reason">阻塞：{card.blockedReason}</div>
      ) : null}
    </button>
  );
}
