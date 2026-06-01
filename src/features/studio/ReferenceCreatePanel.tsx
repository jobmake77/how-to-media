import { FormEvent, useState } from "react";
import { api } from "../../api";
import type { ContentType } from "../../types";

export interface ReferenceCreatePanelProps {
  projectId: string;
  projectType: ContentType;
  onCreated?: () => Promise<void> | void;
}

const initialForm = {
  title: "",
  platform: "",
  url: "",
  content: ""
};

export function ReferenceCreatePanel({
  projectId,
  projectType,
  onCreated
}: ReferenceCreatePanelProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isVideo = projectType === "video";

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.platform.trim() || !form.content.trim()) {
      setError(isVideo ? "请补充标题、平台和转写稿" : "请补充标题、平台和素材内容");
      return;
    }

    setSubmitting(true);
    try {
      await api.createProjectReference(projectId, {
        sourceType: isVideo ? "transcript" : "url",
        contentType: isVideo ? "video" : "image_text",
        platform: form.platform.trim(),
        url: form.url.trim(),
        title: form.title.trim(),
        notes: form.content.trim(),
        ...(isVideo
          ? { transcript: form.content.trim() }
          : { rawText: form.content.trim() })
      });
      setForm(initialForm);
      await onCreated?.();
    } catch {
      setError("素材添加失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="reference-create-panel" onSubmit={handleSubmit}>
      <header>
        <h3>{isVideo ? "补充视频转写稿" : "补充图文素材"}</h3>
        <p>
          {isVideo
            ? "添加一条带转写稿的视频 reference，用于视频诊断。"
            : "添加图文对标素材，用于结构诊断和图片规划。"}
        </p>
      </header>

      <div className="reference-create-grid">
        <label>
          <span>素材标题</span>
          <input
            aria-label="素材标题"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>

        <label>
          <span>素材平台</span>
          <input
            aria-label="素材平台"
            value={form.platform}
            onChange={(event) => updateField("platform", event.target.value)}
          />
        </label>

        <label>
          <span>素材链接</span>
          <input
            aria-label="素材链接"
            value={form.url}
            onChange={(event) => updateField("url", event.target.value)}
          />
        </label>
      </div>

      <label className="reference-create-content">
        <span>{isVideo ? "转写稿内容" : "素材内容"}</span>
        <textarea
          aria-label={isVideo ? "转写稿内容" : "素材内容"}
          value={form.content}
          onChange={(event) => updateField("content", event.target.value)}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-action" disabled={submitting} type="submit">
        {submitting
          ? "添加中..."
          : isVideo
            ? "添加视频转写稿"
            : "添加图文素材"}
      </button>
    </form>
  );
}
