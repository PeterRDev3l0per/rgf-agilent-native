import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useLanguage } from "@/contexts/LanguageContext";
import SortableTaskCard from "./SortableTaskCard";
import { Task } from "./TaskCard";

interface KanbanColumnProps {
  title: string;
  count: number;
  tasks: Task[];
  status: "todo" | "inprogress" | "client_approval" | "done";
  onAddTask: (status: string) => void;
  onTaskClick?: (task: Task) => void;
  isReadOnly?: boolean;
}

const statusIndicators: Record<string, { 
  color: string; 
  headerColor?: string;
}> = {
  todo: { 
    color: "bg-[hsl(var(--status-todo))]", 
  },
  inprogress: { 
    color: "bg-[hsl(var(--tag-mobile))]", 
  },
  client_approval: { 
    color: "bg-[hsl(var(--status-approval))]", 
    headerColor: "text-[hsl(var(--column-header-blue))]",
  },
  done: { 
    color: "bg-[hsl(var(--status-done))]", 
  },
};

// Get gradient opacity based on task count
const getGradientOpacity = (taskCount: number): number => {
  if (taskCount === 0) return 0.20;
  if (taskCount >= 1 && taskCount <= 1) return 0.35;
  if (taskCount >= 2 && taskCount <= 5) return 0.50;
  return 1.0;
};

// Generate column gradient based on status and opacity (theme-aware via CSS variable)
const getColumnGradient = (status: string, opacity: number): string => {
  // Use hsl(var(--column-base)) as the base color that switches with theme
  const baseColor = 'hsl(var(--column-base))';
  
  switch (status) {
    case "todo":
      // Green gradient (bottom-left → center)
      return `linear-gradient(17deg, rgba(230, 240, 231, ${0.70 * opacity}) 0%, rgba(116, 253, 132, ${0.40 * opacity}) 18.3%, rgba(66, 135, 91, 0.00) 49.98%), ${baseColor}`;
    case "inprogress":
      // White → Orange → Faded orange (bottom-right → center)
      return `linear-gradient(318deg, rgba(255, 255, 255, ${0.70 * opacity}) 0%, rgba(255, 183, 100, ${0.50 * opacity}) 18.3%, rgba(255, 139, 6, 0.00) 51.53%), ${baseColor}`;
    case "client_approval":
      // Blue gradient (bottom-left → center)
      return `linear-gradient(17deg, rgba(230, 240, 241, ${0.60 * opacity}) 0%, rgba(78, 167, 252, ${0.45 * opacity}) 18.3%, rgba(78, 167, 252, 0.00) 49.98%), ${baseColor}`;
    case "done":
      // Dark green gradient (bottom-left → center)
      return `linear-gradient(17deg, rgba(230, 240, 231, ${0.35 * opacity}) 0%, rgba(66, 135, 91, ${0.40 * opacity}) 18.3%, rgba(66, 135, 91, 0.00) 49.98%), ${baseColor}`;
    default:
      return baseColor;
  }
};

const KanbanColumn = ({
  title,
  count,
  tasks,
  status,
  onAddTask,
  onTaskClick,
  isReadOnly = false,
}: KanbanColumnProps) => {
  const { t } = useLanguage();
  const indicator = statusIndicators[status];
  
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "column",
      status,
    }
  });

  const taskIds = tasks.map(task => task.id);
  
  // Calculate gradient opacity based on task count
  const gradientOpacity = getGradientOpacity(tasks.length);
  const columnGradient = getColumnGradient(status, gradientOpacity);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Column Container */}
      <div 
        ref={setNodeRef}
        id={status === 'inprogress' ? 'col-in-progress' : `col-${status}`}
        className={`
          p-4 flex flex-col relative overflow-hidden
          rounded-[12px]
          transition-all duration-300
          ${isOver 
            ? "scale-[1.01] ring-2 ring-primary/30" 
            : ""
          }
        `}
        style={{
          background: columnGradient,
          boxShadow: 'var(--column-shadow-light)',
        }}
      >
        {/* Gradient stroke overlay - uses theme-aware colors */}
        <div 
          className="absolute inset-0 rounded-[12px] pointer-events-none"
          style={{
            padding: '1px',
            background: 'linear-gradient(145deg, hsl(var(--column-stroke-1) / 0) 0%, hsl(var(--column-stroke-2) / 0.58) 58%, hsl(var(--column-stroke-2) / 0.58) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Column Header - Inside the container */}
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <div className={`w-1 h-5 rounded-full ${indicator.color}`} />
          <h2 className={`font-semibold tracking-tight ${indicator.headerColor || "text-foreground"}`}>
            {status === "todo" ? t("status.backlog") :
             status === "inprogress" ? t("status.inProgress") :
             status === "client_approval" ? t("status.verification") :
             status === "done" ? t("status.done") : title}
          </h2>
        </div>

        {/* Tasks - scrollbar hidden but scrollable */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className={`space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-all duration-200 relative z-10 min-h-[60px] ${isOver ? "opacity-80" : ""}`}>
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
            
            {/* Ghost plus button INSIDE empty column - styled like task card */}
            {tasks.length === 0 && !isReadOnly && !isOver && (
              <button
                onClick={() => onAddTask(status)}
                className="w-full h-20 rounded-[12px] flex items-center justify-center text-[hsl(var(--plus-btn-text))] hover:text-[hsl(var(--plus-btn-text-hover))] transition-all"
                style={{
                  background: 'hsl(var(--plus-btn-bg))',
                  border: '1px solid hsl(var(--plus-btn-border))',
                }}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            
            {/* Drop zone indicator when dragging over empty area */}
            {isOver && tasks.length === 0 && (
              <div className="h-20 rounded-[12px] border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                Drop here
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      {/* Add Task Button - OUTSIDE the container, only when column has tasks */}
      {!isReadOnly && tasks.length > 0 && (
        <button
          onClick={() => onAddTask(status)}
          className="relative overflow-hidden w-full h-12 min-h-[48px] flex items-center justify-center rounded-[12px] text-[hsl(var(--plus-btn-text))] hover:text-[hsl(var(--plus-btn-text-hover))] transition-all"
          style={{
            background: 'hsl(var(--plus-btn-bg))',
            border: '1px solid hsl(var(--plus-btn-border))',
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
