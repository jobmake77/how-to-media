import type { Artifact, ContentProject, ReferenceItem } from "../domain";
import type { createDatabase } from "../repository";
import type { AiActionDefinition, RequiredInput } from "./actionRegistry";
import { getActionDefinition } from "./actionRegistry";

export interface BuildActionContextInput {
  actionId: string;
  projectId: string;
  stage: string;
}

export type ActionContextResult =
  | {
      ok: true;
      action: AiActionDefinition;
      inputSnapshot: ActionInputSnapshot;
    }
  | {
      ok: false;
      missingInputs: string[];
    };

export interface ActionInputSnapshot {
  project: ContentProject;
  stage: string;
  references: ReferenceItem[];
  acceptedArtifacts: Artifact[];
  draftArtifacts: Artifact[];
  action: {
    id: string;
    label: string;
    outputArtifactType: Artifact["type"];
    acceptedTarget: string;
  };
}

export function buildActionContext(
  repository: ReturnType<typeof createDatabase>,
  input: BuildActionContextInput
): ActionContextResult {
  const project = repository.getProject(input.projectId);
  if (!project) {
    return { ok: false, missingInputs: ["项目不存在"] };
  }

  const action = getActionDefinition(input.actionId);
  if (!action) {
    return { ok: false, missingInputs: ["AI 动作不存在"] };
  }

  if (
    !action.contentTypes.includes(project.type) ||
    !action.stages.includes(input.stage)
  ) {
    return {
      ok: false,
      missingInputs: ["当前内容类型或阶段不支持此 AI 动作"]
    };
  }

  const references = repository.listReferences(project.id);
  const artifacts = repository.listArtifacts(project.id);
  const acceptedArtifacts = artifacts.filter(
    (artifact) => artifact.status === "accepted"
  );
  const draftArtifacts = artifacts.filter((artifact) => artifact.status === "draft");
  const missingInputs = findMissingInputs(
    action.requiredInputs,
    references,
    acceptedArtifacts
  );

  if (missingInputs.length > 0) {
    return { ok: false, missingInputs };
  }

  return {
    ok: true,
    action,
    inputSnapshot: {
      project,
      stage: input.stage,
      references,
      acceptedArtifacts,
      draftArtifacts,
      action: {
        id: action.id,
        label: action.label,
        outputArtifactType: action.outputArtifactType,
        acceptedTarget: action.acceptedTarget
      }
    }
  };
}

function findMissingInputs(
  requiredInputs: RequiredInput[],
  references: ReferenceItem[],
  acceptedArtifacts: Artifact[]
): string[] {
  return requiredInputs.flatMap((requiredInput) => {
    switch (requiredInput) {
      case "project":
        return [];
      case "image_reference":
        return hasImageReference(references)
          ? []
          : ["需要至少一条图文对标 reference"];
      case "video_transcript_reference":
        return hasVideoTranscriptReference(references)
          ? []
          : ["需要至少一条视频转写稿 reference"];
      case "accepted_diagnosis":
        return hasAcceptedArtifact(acceptedArtifacts, "diagnosis")
          ? []
          : ["需要先接受一份诊断 artifact"];
      case "accepted_image_plan":
        return hasAcceptedArtifact(acceptedArtifacts, "image_plan")
          ? []
          : ["需要先接受一份图片规划 artifact"];
      case "accepted_script":
        return hasAcceptedArtifact(acceptedArtifacts, "script")
          ? []
          : ["需要先接受一份口播脚本 artifact"];
      case "accepted_cut_list":
        return hasAcceptedArtifact(acceptedArtifacts, "cut_list")
          ? []
          : ["需要先接受一份剪辑清单 artifact"];
      case "accepted_publish_pack":
        return hasAcceptedArtifact(acceptedArtifacts, "publish_pack")
          ? []
          : ["需要先接受一份发布包 artifact"];
    }
  });
}

function hasImageReference(references: ReferenceItem[]): boolean {
  return references.some(
    (reference) =>
      reference.contentType === "image_text" || reference.contentType === "mixed"
  );
}

function hasVideoTranscriptReference(references: ReferenceItem[]): boolean {
  return references.some((reference) => {
    if (reference.contentType !== "video" && reference.contentType !== "mixed") {
      return false;
    }

    return (
      reference.transcript.trim().length > 0 ||
      (reference.sourceType === "transcript" && reference.rawText.trim().length > 0)
    );
  });
}

function hasAcceptedArtifact(
  artifacts: Artifact[],
  artifactType: Artifact["type"]
): boolean {
  return artifacts.some((artifact) => artifact.type === artifactType);
}
