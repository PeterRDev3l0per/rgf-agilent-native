import { useState, useCallback } from "react";
import ChatRagView from "@/components/dashboard/ChatRagView";
import FloatingRagChatBubble from "@/components/dashboard/FloatingRagChatBubble";
import TopNavBar from "@/components/dashboard/TopNavBar";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
import GanttView from "@/components/dashboard/GanttView";
import AnimatedWaveBackground from "@/components/dashboard/AnimatedWaveBackground";
import NewTaskDialog from "@/components/dashboard/NewTaskDialog";
import NewProjectDialog from "@/components/dashboard/NewProjectDialog";
import ProjectSettingsDialog from "@/components/dashboard/ProjectSettingsDialog";
import TaskDetailsDialog from "@/components/dashboard/TaskDetailsDialog";
import CommandPalette from "@/components/dashboard/CommandPalette";
import { useProjects, Project } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useNotifications } from "@/hooks/useNotifications";
import { Task } from "@/components/dashboard/TaskCard";
import { useToast } from "@/hooks/use-toast";
import { Kanban, Calendar } from "lucide-react";

const Index = () => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("Home");
  const [viewMode, setViewMode] = useState<"kanban" | "gantt">("kanban");
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [commandPaletteTask, setCommandPaletteTask] = useState<Task | null>(null);
  const [commandPaletteTaskOpen, setCommandPaletteTaskOpen] = useState(false);

  const {
    projects,
    currentProject,
    loading: projectLoading,
    createProject,
    selectProject,
    refetch: refetchProjects,
  } = useProjects();

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll: clearNotifications,
    createNotification,
  } = useNotifications();

  // Callback for task status changes — creates notification on transition
  const handleTaskStatusChanged = useCallback(
    async (task: Task, newStatus: Task["status"]) => {
      if (!currentProject?.id) return;

      const statusLabels: Record<string, string> = {
        todo: "Backlog",
        inprogress: "En Proceso",
        client_approval: "Verificación",
        done: "Completado",
      };

      await createNotification(
        currentProject.id,
        ["user-pedro"],
        "task_status_changed",
        "Estado de Tarea Actualizado",
        `"${task.title}" se movió a ${statusLabels[newStatus] ?? newStatus}`,
        task.id
      );
    },
    [currentProject?.id, createNotification]
  );

  const {
    tasks,
    loading: tasksLoading,
    setTasks,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    reorderTasks,
  } = useTasks(currentProject?.id || null, handleTaskStatusChanged);

  // ── Handlers ──────────────────────────────────────────────────

  const handleNewTask = async (taskData: {
    title: string;
    description: string;
    status: string;
    priority: string;
    tagIds: string[];
    assigneeIds: string[];
    dueDate?: Date | null;
  }) => {
    const createdTask = await createTask(taskData);
    setNewTaskDialogOpen(false);

    if (currentProject?.id && createdTask) {
      await createNotification(
        currentProject.id,
        ["user-pedro"],
        "task_created",
        "Nueva Tarea Creada",
        `"${taskData.title}" fue agregada al proyecto`,
        createdTask.id
      );
    }
  };

  const handleNewProject = async (name: string) => {
    await createProject(name);
    setNewProjectDialogOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleProjectSettings = () => setProjectSettingsOpen(true);
  const handleOpenNewTask = () => setNewTaskDialogOpen(true);
  const handleOpenNewProject = () => setNewProjectDialogOpen(true);

  const handleCommandPaletteTaskClick = useCallback((task: Task) => {
    setCommandPaletteTask(task);
    setCommandPaletteTaskOpen(true);
  }, []);

  const handleCommandPaletteTaskUpdate = useCallback(
    async (
      taskId: string,
      updates: {
        title: string;
        description: string;
        priority: string;
        tagIds: string[];
        assigneeIds: string[];
        dueDate: Date | null;
      }
    ) => {
      await updateTask(taskId, updates);
    },
    [updateTask]
  );

  return (
    <div className="h-screen relative flex flex-col overflow-hidden bg-[#09090b]">
      {/* Dynamic Animated Liquid Wave Glassmorphism Background */}
      <AnimatedWaveBackground />

      <TopNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewTask={handleOpenNewTask}
        onNewProject={handleOpenNewProject}
        onProjectSettings={handleProjectSettings}
        currentProject={currentProject}
        projects={projects}
        onSelectProject={selectProject}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationsOpen={markAllAsRead}
        onClearNotifications={clearNotifications}
      />

      <main className="pt-20 h-full flex-1 relative z-10 flex flex-col overflow-hidden">
        {/* View Switcher Toggle Bar (Kanban vs Gantt) */}
        {activeTab !== "Chat" && (
          <div className="px-4 md:px-8 pt-3 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#09090b]/80 border border-white/10 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  viewMode === "kanban"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                Tablero Kanban
              </button>
              <button
                onClick={() => setViewMode("gantt")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  viewMode === "gantt"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Timeline Gantt
              </button>
            </div>
          </div>
        )}

        <div className="h-full flex-1 overflow-hidden animate-fade-in">
          {activeTab === "Chat" ? (
            <ChatRagView currentProject={currentProject} />
          ) : viewMode === "gantt" ? (
            <GanttView
              tasks={tasks}
              currentProject={currentProject}
              onTaskClick={handleCommandPaletteTaskClick}
            />
          ) : (
            <KanbanBoard
              key={currentProject?.id ?? "no-project"}
              tasks={tasks}
              setTasks={setTasks}
              tasksLoading={tasksLoading}
              currentProject={currentProject}
              projectLoading={projectLoading}
              updateTaskStatus={updateTaskStatus}
              createTask={createTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              reorderTasks={reorderTasks}
              createNotification={createNotification}
            />
          )}
        </div>
      </main>

      <NewTaskDialog
        open={newTaskDialogOpen}
        onOpenChange={setNewTaskDialogOpen}
        onSubmit={handleNewTask}
        project={currentProject}
      />

      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
        onSubmit={handleNewProject}
      />

      <ProjectSettingsDialog
        open={projectSettingsOpen}
        onOpenChange={setProjectSettingsOpen}
        project={currentProject}
        onProjectUpdated={refetchProjects}
      />

      <CommandPalette
        tasks={tasks}
        currentProject={currentProject}
        onNewTask={handleOpenNewTask}
        onNewProject={handleOpenNewProject}
        onTaskClick={handleCommandPaletteTaskClick}
      />

      <TaskDetailsDialog
        open={commandPaletteTaskOpen}
        onOpenChange={setCommandPaletteTaskOpen}
        task={commandPaletteTask}
        onUpdate={handleCommandPaletteTaskUpdate}
        onDelete={deleteTask}
        project={currentProject}
      />

      {/* Floating RAG Chat Bubble */}
      <FloatingRagChatBubble currentProject={currentProject} />
    </div>
  );
};

export default Index;
