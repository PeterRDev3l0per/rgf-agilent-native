import { Eye, Circle, AlertTriangle, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags: { id?: string; name: string; color: string }[];
  assignees: { id: string; name: string; avatar?: string; avatarColor?: string }[];
  dueDate: string;
  taskNumber: string | number;
  status: "todo" | "inprogress" | "client_approval" | "done";
  priority?: string;
  position?: number;
  project_id?: string;
  start_date?: string;
  target_date?: string;
}

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Priority icon component for task cards (Semaphore colors: Low=Light Blue, Medium=Amber, High=Red)
const TaskCardPriorityIcon = ({ priority }: { priority: string }) => {
  const p = (priority || "medium").toLowerCase();
  if (p === "high" || p === "alta" || p === "alto") {
    return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  }
  if (p === "low" || p === "baja" || p === "bajo") {
    return <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />;
  }
  return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const TaskCard = ({ task, isDragOverlay = false }: TaskCardProps) => {
  const { t } = useLanguage();

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-[12px] p-4 transition-all duration-200 group
        ${isDragOverlay 
          ? "cursor-grabbing" 
          : "cursor-grab hover:brightness-105"
        }
      `}
      style={{
        background: 'linear-gradient(135deg, hsl(var(--card-bg-start)) 0%, hsl(var(--card-bg-end)) 100%)',
        border: '1px solid hsl(var(--card-border))',
      }}
    >
      {/* Date Row */}
      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="tracking-tight">
            {task.dueDate && task.dueDate !== "No due date" && task.dueDate !== "Sin fecha de entrega" && task.dueDate !== "Sin fecha" 
              ? task.dueDate 
              : t("task.noDueDate")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium tracking-tight">{task.taskNumber}</span>
          <TaskCardPriorityIcon priority={task.priority || "medium"} />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-medium text-foreground mb-3 line-clamp-2 tracking-tight">
        {task.title}
      </h3>

      {/* Bottom Row: Tags + Assignees */}
      <div className="flex items-center justify-between">
        {/* Tags - now with dynamic colors (10% opacity bg, full color text) */}
        <div className="flex flex-wrap gap-2">
          {task.tags.map((tag, index) => {
            const rgb = hexToRgb(tag.color);
            const bgColor = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : "rgba(59, 130, 246, 0.1)";
            const textColor = tag.color;
            
            return (
              <span
                key={tag.id || index}
                className="px-3 py-1 rounded-md text-xs font-semibold tracking-tight"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>

        {/* Assignees with initials */}
        <div className="flex -space-x-2">
          {task.assignees.slice(0, 3).map((assignee) => {
            const initials = assignee.name
              .trim()
              .split(/\s+/)
              .map(w => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
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

export default TaskCard;
