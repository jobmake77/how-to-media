import { useEffect, useState } from "react";
import { api } from "../api";
import { ImageTextStudio } from "../features/studio/ImageTextStudio";
import { VideoStudio } from "../features/studio/VideoStudio";
import type { StudioState } from "../types";

export interface ProductionStudioPageProps {
  projectId: string;
  onBack?: () => void;
  onRefreshWorkbench?: () => void;
}

export function ProductionStudioPage({
  projectId,
  onBack,
  onRefreshWorkbench
}: ProductionStudioPageProps) {
  const [studio, setStudio] = useState<StudioState | null>(null);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadStudio = async () => {
    setError("");
    const state = await api.getStudio(projectId);
    setStudio(state);
    setSelectedStageId((current) => current || state.currentStage.id);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .getStudio(projectId)
      .then((state) => {
        if (!mounted) {
          return;
        }
        setStudio(state);
        setSelectedStageId(state.currentStage.id);
      })
      .catch(() => {
        if (mounted) {
          setError("生产舱加载失败");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  const runAction = async (actionId: string) => {
    if (!studio) {
      return;
    }
    setActionError("");

    try {
      await api.createAiJob({
        actionId,
        projectId: studio.project.id,
        stage: selectedStageId
      });
      await loadStudio();
      onRefreshWorkbench?.();
    } catch {
      setActionError("AI 任务创建失败");
    }
  };

  if (loading) {
    return <p>正在加载生产舱...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!studio) {
    return <p>暂无生产舱数据</p>;
  }

  return (
    <section className="production-studio-page">
      <header className="studio-header">
        <button className="secondary-action" onClick={onBack} type="button">
          返回工作台
        </button>
        <div>
          <p className="eyebrow">
            {studio.project.type === "image_text" ? "图文" : "视频"} ·{" "}
            {studio.project.platforms.join("、")}
          </p>
          <h1>{studio.project.title}</h1>
        </div>
        <div className="studio-header-meta">
          <span>状态 {studio.project.workflowStatus}</span>
          <span>阶段 {studio.currentStage.label}</span>
          <span>下一步 {studio.project.nextAction}</span>
        </div>
      </header>

      {actionError ? <p className="form-error">{actionError}</p> : null}

      {studio.project.type === "image_text" ? (
        <ImageTextStudio
          onReferenceCreated={loadStudio}
          onRunAction={runAction}
          onSelectStage={setSelectedStageId}
          selectedStageId={selectedStageId}
          studio={studio}
        />
      ) : (
        <VideoStudio
          onReferenceCreated={loadStudio}
          onRunAction={runAction}
          onSelectStage={setSelectedStageId}
          selectedStageId={selectedStageId}
          studio={studio}
        />
      )}
    </section>
  );
}
