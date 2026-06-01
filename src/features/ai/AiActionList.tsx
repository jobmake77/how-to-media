import type { AiQueueState } from "../../types";

export interface AiActionListProps {
  actions: AiQueueState["availableActions"];
  onRunAction?: (actionId: string) => void;
}

export function AiActionList({ actions, onRunAction }: AiActionListProps) {
  if (actions.length === 0) {
    return <p className="ai-empty-state">暂无可执行动作</p>;
  }

  return (
    <div className="ai-action-list">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onRunAction?.(action.id)}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
