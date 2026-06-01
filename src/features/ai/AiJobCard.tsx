import type { AiQueueState } from "../../types";

export type AiJobCardJob =
  | AiQueueState["running"][number]
  | AiQueueState["awaitingReview"][number]
  | AiQueueState["failed"][number];

export interface AiJobCardProps {
  job: AiJobCardJob;
  kind: "running" | "awaiting_review" | "failed";
  onAccept?: (jobId: string) => Promise<void> | void;
  onReject?: (jobId: string) => Promise<void> | void;
}

export function AiJobCard({
  job,
  kind,
  onAccept,
  onReject
}: AiJobCardProps) {
  const status = "status" in job ? job.status : "failed";
  const error = "error" in job ? job.error : "";

  return (
    <article className={`ai-job-card ai-job-card-${kind}`}>
      <div>
        <h3>{job.action}</h3>
        <p>{status}</p>
        {job.projectId ? <small>项目 {job.projectId}</small> : null}
      </div>

      {error ? <p className="ai-job-error">{error}</p> : null}

      {kind === "awaiting_review" ? (
        <div className="ai-job-actions">
          <button onClick={() => onAccept?.(job.id)} type="button">
            接受
          </button>
          <button onClick={() => onReject?.(job.id)} type="button">
            废弃
          </button>
        </div>
      ) : null}
    </article>
  );
}
