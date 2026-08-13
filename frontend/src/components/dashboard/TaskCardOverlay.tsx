import { Clock } from "lucide-react";
import { Task } from "./TaskCard";

interface TaskCardOverlayProps {
  task: Task;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const TaskCardOverlay = ({ task }: TaskCardOverlayProps) => {
  return (
    <div
      className="rounded-[12px] p-4 cursor-grabbing bg-[hsl(var(--task-card-bg-overlay))] backdrop-blur-[var(--task-card-blur)] min-w-[280px] w-full max-w-[calc(25vw-48px)]"
      style={{
        transform: 'rotate(3deg) scale(1.05)',
        transition: 'box-shadow 200ms ease-out, transform 200ms ease-out',
        boxShadow: 'inset 0 1px 1px hsl(var(--task-card-glow-overlay)), 0 25px 50px -12px hsl(var(--task-card-shadow-overlay))',
        border: '1px solid hsl(var(--task-card-border-overlay))',
      }}
    >
      {/* Date Row */}
      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="tracking-tight">{task.dueDate || "No due date"}</span>
        </div>
        <span className="font-medium tracking-tight">{task.taskNumber}</span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-foreground mb-3 line-clamp-2 tracking-tight">
        {task.title}
      </h3>

      {/* Bottom Row: Tags + Assignees */}
      <div className="flex items-center justify-between">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {task.tags.map((tag, index) => {
            const rgb = hexToRgb(tag.color);
            const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "rgba(59, 130, 246, 0.1)";
            return (
              <span
                key={tag.id || index}
                className="px-3 py-1 rounded-md text-xs font-semibold tracking-tight"
                style={{ backgroundColor: bgColor, color: tag.color }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>

        {/* Assignees with initials */}
        <div className="flex -space-x-2">
          {task.assignees.slice(0, 3).map((assignee) => {
            const initials = assignee.name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div
                key={assignee.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[hsl(var(--task-card-bg))]"
                style={{ backgroundColor: assignee.avatarColor || "#3b82f6" }}
                title={assignee.name}
              >
                {initials}
              </div>
            );
          })}
          {task.assignees.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-[#1B1B1B] text-white flex items-center justify-center text-[10px] font-medium border-2 border-[hsl(var(--task-card-bg))]">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardOverlay;
