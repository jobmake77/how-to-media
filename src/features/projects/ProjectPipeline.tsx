import type { WorkbenchState } from "../../types";
import { ProjectCard } from "./ProjectCard";

export interface ProjectPipelineProps {
  columns: WorkbenchState["columns"];
  onOpenProject?: (projectId: string) => void;
}

export function ProjectPipeline({
  columns,
  onOpenProject
}: ProjectPipelineProps) {
  return (
    <section className="project-pipeline" aria-label="内容状态流水线">
      {columns.map((column) => (
        <section className="pipeline-column" key={column.status}>
          <header>
            <h2>{column.title}</h2>
            <span>{column.cards.length}</span>
          </header>

          <div className="pipeline-card-list">
            {column.cards.length > 0 ? (
              column.cards.map((card) => (
                <ProjectCard
                  card={card}
                  key={card.id}
                  onOpen={onOpenProject}
                />
              ))
            ) : (
              <p className="pipeline-empty">暂无内容</p>
            )}
          </div>
        </section>
      ))}
    </section>
  );
}
