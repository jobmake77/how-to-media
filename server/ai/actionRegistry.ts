import type { Artifact, ContentType } from "../domain";

export type AiActionId =
  | "generate_topic_angles"
  | "diagnose_image_references"
  | "generate_image_plan"
  | "generate_image_publish_pack"
  | "diagnose_video_reference"
  | "generate_script"
  | "generate_cut_list"
  | "generate_video_publish_pack"
  | "generate_next_actions";

export type RequiredInput =
  | "project"
  | "image_reference"
  | "video_transcript_reference"
  | "accepted_diagnosis"
  | "accepted_image_plan"
  | "accepted_script"
  | "accepted_cut_list"
  | "accepted_publish_pack";

export interface AiActionDefinition {
  id: AiActionId;
  label: string;
  contentTypes: ContentType[];
  stages: string[];
  outputArtifactType: Artifact["type"];
  acceptedTarget: string;
  requiredInputs: RequiredInput[];
}

const actionDefinitions: AiActionDefinition[] = [
  {
    id: "generate_topic_angles",
    label: "生成选题角度",
    contentTypes: ["image_text", "video"],
    stages: ["topic"],
    outputArtifactType: "brief",
    acceptedTarget: "artifact",
    requiredInputs: ["project"]
  },
  {
    id: "diagnose_image_references",
    label: "诊断图文对标素材",
    contentTypes: ["image_text"],
    stages: ["diagnosis", "references"],
    outputArtifactType: "diagnosis",
    acceptedTarget: "artifact",
    requiredInputs: ["project", "image_reference"]
  },
  {
    id: "generate_image_plan",
    label: "生成图片规划",
    contentTypes: ["image_text"],
    stages: ["image_plan"],
    outputArtifactType: "image_plan",
    acceptedTarget: "artifact",
    requiredInputs: ["project"]
  },
  {
    id: "generate_image_publish_pack",
    label: "生成图文发布包",
    contentTypes: ["image_text"],
    stages: ["publish_pack"],
    outputArtifactType: "publish_pack",
    acceptedTarget: "artifact",
    requiredInputs: ["project", "accepted_image_plan"]
  },
  {
    id: "diagnose_video_reference",
    label: "诊断视频对标转写",
    contentTypes: ["video"],
    stages: ["diagnosis", "reference_videos", "asr_transcript"],
    outputArtifactType: "diagnosis",
    acceptedTarget: "artifact",
    requiredInputs: ["project", "video_transcript_reference"]
  },
  {
    id: "generate_script",
    label: "生成口播脚本",
    contentTypes: ["video"],
    stages: ["script"],
    outputArtifactType: "script",
    acceptedTarget: "artifact",
    requiredInputs: ["project"]
  },
  {
    id: "generate_cut_list",
    label: "生成剪辑清单",
    contentTypes: ["video"],
    stages: ["edit_plan"],
    outputArtifactType: "cut_list",
    acceptedTarget: "artifact",
    requiredInputs: ["project", "accepted_script"]
  },
  {
    id: "generate_video_publish_pack",
    label: "生成视频发布包",
    contentTypes: ["video"],
    stages: ["publish_pack"],
    outputArtifactType: "publish_pack",
    acceptedTarget: "artifact",
    requiredInputs: ["project", "accepted_script"]
  },
  {
    id: "generate_next_actions",
    label: "生成下一步动作",
    contentTypes: ["image_text", "video"],
    stages: [
      "topic",
      "references",
      "reference_videos",
      "asr_transcript",
      "diagnosis",
      "title_cover",
      "image_plan",
      "body_caption",
      "script",
      "recording_plan",
      "edit_plan",
      "publish_pack",
      "retrospective"
    ],
    outputArtifactType: "brief",
    acceptedTarget: "project_next_action",
    requiredInputs: ["project"]
  }
];

export function listActionDefinitions(): AiActionDefinition[] {
  return actionDefinitions.map(cloneAction);
}

export function getActionDefinition(
  actionId: string
): AiActionDefinition | undefined {
  const action = actionDefinitions.find((definition) => definition.id === actionId);
  return action ? cloneAction(action) : undefined;
}

export function getAvailableActions(
  contentType: ContentType,
  stage: string
): AiActionDefinition[] {
  return actionDefinitions
    .filter(
      (definition) =>
        definition.contentTypes.includes(contentType) &&
        definition.stages.includes(stage)
    )
    .map(cloneAction);
}

function cloneAction(action: AiActionDefinition): AiActionDefinition {
  return {
    ...action,
    contentTypes: [...action.contentTypes],
    stages: [...action.stages],
    requiredInputs: [...action.requiredInputs]
  };
}
