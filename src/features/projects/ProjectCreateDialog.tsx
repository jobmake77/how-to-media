import { FormEvent, useState } from "react";
import { api } from "../../api";
import type { ContentType, WorkflowStatus } from "../../types";

export interface ProjectCreateDialogProps {
  onCreated?: () => void;
}

const initialForm = {
  type: "image_text" as ContentType,
  title: "",
  platforms: "小红书",
  contentPillar: "",
  targetAudience: "",
  promise: "",
  workflowStatus: "idea" as WorkflowStatus
};

export function ProjectCreateDialog({ onCreated }: ProjectCreateDialogProps) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = <Key extends keyof typeof form>(
    key: Key,
    value: (typeof form)[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const platforms = form.platforms
      .split(/[\s,，、]+/)
      .map((platform) => platform.trim())
      .filter(Boolean);

    if (
      !form.title.trim() ||
      platforms.length === 0 ||
      !form.contentPillar.trim() ||
      !form.targetAudience.trim() ||
      !form.promise.trim()
    ) {
      setError("请补全项目标题、平台、内容支柱、目标用户和内容承诺");
      return;
    }

    setSubmitting(true);
    try {
      await api.createProject({
        type: form.type,
        title: form.title.trim(),
        platforms,
        contentPillar: form.contentPillar.trim(),
        targetAudience: form.targetAudience.trim(),
        promise: form.promise.trim(),
        goal: `${form.title.trim()} 进入生产流水线`,
        workflowStatus: form.workflowStatus
      });
      setForm(initialForm);
      onCreated?.();
    } catch {
      setError("创建项目失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="project-create-panel" onSubmit={handleSubmit}>
      <header>
        <h2>新建内容项目</h2>
        <p>把新的选题放入状态流水线，后续再补素材和 AI 产物。</p>
      </header>

      <label>
        <span>类型</span>
        <select
          value={form.type}
          onChange={(event) =>
            updateField("type", event.target.value as ContentType)
          }
        >
          <option value="image_text">图文</option>
          <option value="video">视频</option>
        </select>
      </label>

      <label>
        <span>标题</span>
        <input
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="例如：AI 图文选题"
        />
      </label>

      <label>
        <span>平台</span>
        <input
          value={form.platforms}
          onChange={(event) => updateField("platforms", event.target.value)}
          placeholder="小红书，抖音"
        />
      </label>

      <label>
        <span>内容支柱</span>
        <input
          value={form.contentPillar}
          onChange={(event) => updateField("contentPillar", event.target.value)}
          placeholder="AI 工作流"
        />
      </label>

      <label>
        <span>目标用户</span>
        <input
          value={form.targetAudience}
          onChange={(event) => updateField("targetAudience", event.target.value)}
          placeholder="个人创作者"
        />
      </label>

      <label>
        <span>内容承诺</span>
        <input
          value={form.promise}
          onChange={(event) => updateField("promise", event.target.value)}
          placeholder="用一套流程稳定产出内容"
        />
      </label>

      <label>
        <span>创建位置</span>
        <select
          value={form.workflowStatus}
          onChange={(event) =>
            updateField("workflowStatus", event.target.value as WorkflowStatus)
          }
        >
          <option value="idea">放入选题池</option>
          <option value="reference">放入对标素材</option>
        </select>
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary-action" disabled={submitting} type="submit">
        {submitting ? "创建中..." : "创建项目"}
      </button>
    </form>
  );
}
