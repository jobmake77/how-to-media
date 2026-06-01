import { useState } from "react";
import type { Artifact, ReferenceItem, StudioStage, StudioState } from "../../types";
import { ReferenceCreatePanel } from "./ReferenceCreatePanel";

export interface StageEditorProps {
  studio: StudioState;
  stage: StudioStage;
  guidance: string;
  onReferenceCreated?: () => Promise<void> | void;
  onRunAction?: (actionId: string) => Promise<void> | void;
}

export function StageEditor({
  studio,
  stage,
  guidance,
  onReferenceCreated,
  onRunAction
}: StageEditorProps) {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const actions = studio.availableAiActions.filter(
    (action) => action.stage === stage.id
  );

  return (
    <section className="stage-editor">
      <header>
        <h2>当前阶段：{stage.label}</h2>
        <p>{stage.description}</p>
        <div className="stage-guidance">{guidance}</div>
      </header>

      <section className="stage-resource-section">
        <h3>输入素材</h3>
        {studio.references.length > 0 ? (
          <div className="stage-resource-list">
            {studio.references.map((reference) => (
              <ReferenceRow key={reference.id} reference={reference} />
            ))}
          </div>
        ) : (
          <p className="stage-empty">暂无输入素材</p>
        )}
        <ReferenceCreatePanel
          onCreated={onReferenceCreated}
          projectId={studio.project.id}
          projectType={studio.project.type}
        />
      </section>

      <section className="stage-resource-section">
        <h3>已确认产物</h3>
        {studio.acceptedArtifacts.length > 0 ? (
          <div className="stage-resource-list">
            {studio.acceptedArtifacts.map((artifact) => (
              <ArtifactRow artifact={artifact} key={artifact.id} />
            ))}
          </div>
        ) : (
          <p className="stage-empty">暂无已确认产物</p>
        )}
      </section>

      <section className="stage-resource-section">
        <h3>待确认草稿</h3>
        {studio.draftArtifacts.length > 0 ? (
          <div className="stage-resource-list">
            {studio.draftArtifacts.map((artifact) => (
              <ArtifactRow artifact={artifact} key={artifact.id} />
            ))}
          </div>
        ) : (
          <p className="stage-empty">暂无待确认草稿</p>
        )}
      </section>

      <section className="stage-resource-section">
        <h3>AI 动作</h3>
        {actions.length > 0 ? (
          <div className="stage-action-list">
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
        ) : (
          <p className="stage-empty">当前阶段暂无 AI 动作</p>
        )}
      </section>

      <section className="stage-resource-section">
        <label className="manual-notes">
          <span>人工备注</span>
          <textarea
            aria-label="人工备注"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
          />
        </label>
        <button
          className="primary-action"
          onClick={() => setSaved(true)}
          type="button"
        >
          保存备注
        </button>
        {saved ? <p className="stage-saved">备注已保存</p> : null}
      </section>
    </section>
  );
}

function ReferenceRow({ reference }: { reference: ReferenceItem }) {
  return (
    <article className="stage-resource-row">
      <strong>{reference.title}</strong>
      <span>{reference.platform}</span>
    </article>
  );
}

function ArtifactRow({ artifact }: { artifact: Artifact }) {
  return (
    <article className="stage-resource-row">
      <strong>{artifact.title}</strong>
      <span>{artifact.type}</span>
    </article>
  );
}
