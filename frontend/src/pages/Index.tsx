import { useState, useCallback } from "react";
import ChatRagView from "@/components/dashboard/ChatRagView";
import FloatingRagChatBubble from "@/components/dashboard/FloatingRagChatBubble";
import TopNavBar from "@/components/dashboard/TopNavBar";
import KanbanBoard from "@/components/dashboard/KanbanBoard";
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

const Index = () => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("Home");
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
    <div className="h-screen bg-[hsl(var(--site-bg))] relative flex flex-col overflow-hidden">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--site-bg-dots))_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

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

      <main className="pt-24 h-full flex-1">
        <div className="h-full animate-fade-in">
          {activeTab === "Chat" ? (
            <ChatRagView currentProject={currentProject} />
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
