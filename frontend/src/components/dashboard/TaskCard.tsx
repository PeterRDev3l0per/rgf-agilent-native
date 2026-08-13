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

const formatTagDisplay = (rawName: string, userLang: string = "es") => {
  const clean = (rawName || "").replace(/^tag-/, "").trim();
  const lower = clean.toLowerCase();

  if (lower === "core" || lower === "núcleo") {
    return {
      name: userLang === "es" ? "Core" : "Core",
      bgColor: "rgba(168, 85, 247, 0.15)",
      textColor: "#c084fc",
      borderColor: "rgba(168, 85, 247, 0.3)",
    };
  }
  if (lower === "database" || lower === "bd" || lower === "base de datos") {
    return {
      name: userLang === "es" ? "Base de Datos" : "Database",
      bgColor: "rgba(16, 185, 129, 0.15)",
      textColor: "#34d399",
      borderColor: "rgba(16, 185, 129, 0.3)",
    };
  }
  if (lower === "backend" || lower === "servidor" || lower === "api") {
    return {
      name: userLang === "es" ? "Servidor API" : "Backend",
      bgColor: "rgba(6, 182, 212, 0.15)",
      textColor: "#22d3ee",
      borderColor: "rgba(6, 182, 212, 0.3)",
    };
  }
  if (lower === "frontend" || lower === "ui" || lower === "ux") {
    return {
      name: userLang === "es" ? "Interfaz UI" : "Frontend",
      bgColor: "rgba(236, 72, 153, 0.15)",
      textColor: "#f472b6",
      borderColor: "rgba(236, 72, 153, 0.3)",
    };
  }
  if (lower === "funcionalidad" || lower === "feature") {
    return {
      name: userLang === "es" ? "Funcionalidad" : "Feature",
      bgColor: "rgba(2, 132, 199, 0.15)",
      textColor: "#38bdf8",
      borderColor: "rgba(2, 132, 199, 0.3)",
    };
  }

  const capitalized = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Tag";
  return {
    name: capitalized,
    bgColor: "rgba(59, 130, 246, 0.15)",
    textColor: "#60a5fa",
    borderColor: "rgba(59, 130, 246, 0.3)",
  };
};

const TaskCard = ({ task, isDragOverlay = false }: TaskCardProps) => {
  const { language } = useLanguage();
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
        {/* Tags - with clean names, dynamic colors, glassmorphism */}
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag, index) => {
            const formatted = formatTagDisplay(tag.name, language);
            return (
              <span
                key={tag.id || index}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight border backdrop-blur-sm shadow-sm"
                style={{
                  backgroundColor: formatted.bgColor,
                  color: formatted.textColor,
                  borderColor: formatted.borderColor,
                }}
              >
                {formatted.name}
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
