import type { AiQueueState } from "../../types";
import { AiActionList } from "./AiActionList";
import { AiJobCard } from "./AiJobCard";

export interface AiQueuePanelProps {
  queue: AiQueueState;
  onAcceptJob?: (jobId: string) => Promise<void> | void;
  onRejectJob?: (jobId: string) => Promise<void> | void;
  onRunAction?: (actionId: string) => void;
}

export function AiQueuePanel({
  queue,
  onAcceptJob,
  onRejectJob,
  onRunAction
}: AiQueuePanelProps) {
  return (
    <aside className="app-ai-panel ai-queue-panel" aria-label="AI 队列">
      <h2>AI 队列</h2>

      <section className="ai-queue-section">
        <h3>正在运行</h3>
        {queue.running.length > 0 ? (
          queue.running.map((job) => (
            <AiJobCard job={job} key={job.id} kind="running" />
          ))
        ) : (
          <p className="ai-empty-state">暂无运行任务</p>
        )}
      </section>

      <section className="ai-queue-section">
        <h3>等待确认</h3>
        {queue.awaitingReview.length > 0 ? (
          queue.awaitingReview.map((job) => (
            <AiJobCard
              job={job}
              key={job.id}
              kind="awaiting_review"
              onAccept={onAcceptJob}
              onReject={onRejectJob}
            />
          ))
        ) : (
          <p className="ai-empty-state">暂无待确认任务</p>
        )}
      </section>

      <section className="ai-queue-section">
        <h3>失败任务</h3>
        {queue.failed.length > 0 ? (
          queue.failed.map((job) => (
            <AiJobCard job={job} key={job.id} kind="failed" />
          ))
        ) : (
          <p className="ai-empty-state">暂无失败任务</p>
        )}
      </section>

      <section className="ai-queue-section">
        <h3>可执行动作</h3>
        <AiActionList
          actions={queue.availableActions}
          onRunAction={onRunAction}
        />
      </section>
    </aside>
  );
}
