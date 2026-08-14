import React from "react";
import { Task } from "./TaskCard";
import { Project } from "@/hooks/useProjects";
import { Calendar, Clock, Tag, CheckCircle2, AlertCircle, Sparkles, Layers } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GanttViewProps {
  tasks: Task[];
  currentProject: Project | null;
  onTaskClick?: (task: Task) => void;
}

const priorityColors: Record<string, { bar: string; badge: string }> = {
  high: { bar: "bg-gradient-to-r from-red-500 to-rose-400 border-red-400/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]", badge: "bg-red-500/15 text-red-300 border-red-500/30" },
  medium: { bar: "bg-gradient-to-r from-amber-500 to-yellow-400 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  low: { bar: "bg-gradient-to-r from-cyan-500 to-blue-400 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]", badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
};

const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
  todo: { label: "Backlog", bg: "bg-slate-500/20 border-slate-500/30", text: "text-slate-300" },
  inprogress: { label: "En Proceso", bg: "bg-amber-500/20 border-amber-500/30", text: "text-amber-300" },
  client_approval: { label: "Verificación", bg: "bg-purple-500/20 border-purple-500/30", text: "text-purple-300" },
  done: { label: "Completado", bg: "bg-emerald-500/20 border-emerald-500/30", text: "text-emerald-300" },
};

export const GanttView: React.FC<GanttViewProps> = ({ tasks, currentProject, onTaskClick }) => {
  const { t } = useLanguage();

  return (
    <div className="h-full w-full overflow-y-auto px-4 md:px-8 py-6 space-y-6 pb-24 scrollbar-none animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#09090b]/80 border border-white/[0.12] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Timeline & Diagrama de Gantt — {currentProject?.name || "Proyecto"}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {tasks.length} Tareas
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualización cronológica interactiva del backlog y dependencias
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-white/80 bg-white/[0.04] px-4 py-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Alta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Media</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Baja</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      <div className="rounded-2xl bg-[#09090b]/75 border border-white/[0.12] backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground space-y-3">
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
            <p className="text-sm font-medium">No hay tareas en el proyecto actual.</p>
            <p className="text-xs text-muted-foreground/70">Crea una nueva tarea para visualizar la línea de tiempo Gantt.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08]">
            {/* Timeline Header Row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-white/[0.04] text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4 md:col-span-3">Tarea / Tópico</div>
              <div className="col-span-2 hidden md:block">Estado</div>
              <div className="col-span-2 hidden md:block">Prioridad</div>
              <div className="col-span-8 md:col-span-5 text-right md:text-left">Cronograma & Progreso</div>
            </div>

            {/* Gantt Items List */}
            {tasks.map((task) => {
              const priorityInfo = priorityColors[task.priority] || priorityColors.medium;
              const statusInfo = statusLabels[task.status] || statusLabels.todo;
              const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Sin fecha";

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.06] transition-colors cursor-pointer group"
                >
                  {/* Task Title & Tags */}
                  <div className="col-span-4 md:col-span-3 space-y-1">
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge (Desktop) */}
                  <div className="col-span-2 hidden md:block">
                    <span className="text-xs font-medium text-white/80">
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Priority Badge */}
                  <div className="col-span-2 hidden md:block">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold capitalize ${priorityInfo.badge}`}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Timeline Bar Visualizer */}
                  <div className="col-span-8 md:col-span-5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {dueDateStr}
                      </span>
                      <span className="text-white/60">100%</span>
                    </div>
                    {/* Glassmorphic Timeline Progress Bar */}
                    <div className="relative h-3 w-full rounded-full bg-white/[0.08] overflow-hidden p-0.5 border border-white/10">
                      <div
                        className={`h-full rounded-full border ${priorityInfo.bar} transition-all duration-500`}
                        style={{
                          width: task.status === "done" ? "100%" : task.status === "client_approval" ? "75%" : task.status === "inprogress" ? "45%" : "15%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttView;
