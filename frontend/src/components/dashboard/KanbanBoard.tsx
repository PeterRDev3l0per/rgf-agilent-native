import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCorners,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import KanbanColumn from "./KanbanColumn";
import NewTaskDialog from "./NewTaskDialog";
import TaskDetailsDialog from "./TaskDetailsDialog";
import TaskCardOverlay from "./TaskCardOverlay";
import ClientKanbanBoard from "./ClientKanbanBoard";
import { Task } from "./TaskCard";
import { Loader2, Plus } from "lucide-react";
import { Project } from "@/hooks/useProjects";
import { useTheme } from "next-themes";

const allColumns = [
  { id: "todo", title: "To do", status: "todo" as const },
  { id: "inprogress", title: "In Progress", status: "inprogress" as const },
  { id: "client_approval", title: "Verification", status: "client_approval" as const },
  { id: "done", title: "Done", status: "done" as const },
];

// Custom hook for tablet detection
const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkTablet();
    window.addEventListener("resize", checkTablet);
    return () => window.removeEventListener("resize", checkTablet);
  }, []);
  
  return isTablet;
};

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  tasksLoading: boolean;
  currentProject: Project | null;
  projectLoading: boolean;
  updateTaskStatus: (taskId: string, newStatus: Task["status"], newPosition?: number) => Promise<void>;
  createTask: (taskData: { title: string; description?: string; status: string; priority?: string; tagIds?: string[]; assigneeIds?: string[]; dueDate?: Date | null }) => Promise<any>;
  updateTask: (taskId: string, updates: {
    title?: string;
    description?: string;
    priority?: string;
    tagIds?: string[];
    assigneeIds?: string[];
    dueDate?: Date | null;
  }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reorderTasks: (activeId: string, overId: string) => Promise<void>;
  createNotification?: (
    projectId: string,
    targetUserIds: string[],
    type: string,
    title: string,
    message?: string,
    taskId?: string
  ) => Promise<void>;
}

const KanbanBoard = ({
  tasks,
  setTasks,
  tasksLoading,
  currentProject,
  projectLoading,
  updateTaskStatus,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  createNotification,
}: KanbanBoardProps) => {
  const columns = allColumns;
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { theme } = useTheme();
  const isLightMode = theme === "light";
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState("todo");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [originalStatus, setOriginalStatus] = useState<Task["status"] | null>(null);
  // IMPORTANT: state updates can lag during a fast drag; use a ref for authoritative drag-start status.
  const originalStatusRef = useRef<Task["status"] | null>(null);
  const { toast } = useToast();

  // Column status lookup set for O(1) checks
  const columnStatuses = useMemo(() => new Set(columns.map((col) => col.status)), []);

  // Keep the latest tasks in a ref so DnD handlers never read stale closures.
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // RESOLVE ANY ID TO ITS CONTAINER (COLUMN STATUS) - used in BOTH onDragOver and onDragEnd
  const findContainer = useCallback((id: string | UniqueIdentifier): Task["status"] | null => {
    const idStr = String(id);
    
    // Check if id is a column ID (O(1) lookup)
    if (columnStatuses.has(idStr as Task["status"])) {
      return idStr as Task["status"];
    }
    
    // Check if id is a task ID - return the task's current status
    const task = tasksRef.current.find((t) => t.id === idStr);
    if (task) return task.status;
    
    return null;
  }, [columnStatuses]);

  // Custom collision detection: pointerWithin first, fallback to closestCorners
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // First try pointerWithin - most accurate for variable-height cards
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // Fallback to closestCorners for edge cases
    const cornerCollisions = closestCorners(args);
    if (cornerCollisions.length > 0) {
      return cornerCollisions;
    }
    
    // Last resort: rectIntersection
    return rectIntersection(args);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Slightly higher threshold to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasksRef.current.find((t) => t.id === String(active.id));
    if (task) {
      setActiveTask(task);
      // Store original status before any mutations!
      originalStatusRef.current = task.status;
      setOriginalStatus(task.status);
    }
  };

  // handleDragOver - DISABLED to prevent race conditions during rapid drags
  // All status changes now happen exclusively in handleDragEnd
  const handleDragOver = (_event: DragOverEvent) => {
    // NO-OP: We intentionally do nothing here.
    // Visual feedback is provided by the DragOverlay component.
    // All state mutations happen in handleDragEnd to prevent race conditions.
  };

  // SIMPLIFIED "Standardized Engine" - One unified path for ALL moves
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clean up overlay state
    setActiveTask(null);
    originalStatusRef.current = null;
    setOriginalStatus(null);

    // Block if preview mode
    if (guardMutation?.()) return;

    // Safety checks
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // Resolve destination column
    const overContainer = findContainer(overId);
    if (!overContainer) {
      console.error("GHOST NODE: Could not find container for:", overId);
      return;
    }

    // Get fresh task data
    const currentTasks = tasksRef.current;
    const activeTaskItem = currentTasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Get tasks in destination column (excluding the one we're moving), sorted by position
    const destColumnTasks = currentTasks
      .filter((t) => t.status === overContainer && t.id !== activeId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // === THE SIMPLE FLOAT MATH ===
    let newPosition: number;
    const isDroppedOnColumn = columnStatuses.has(overId as Task["status"]);

    if (destColumnTasks.length === 0) {
      // Empty column - start at 1000
      newPosition = 1000;
    } else if (isDroppedOnColumn) {
      // Dropped on column header/empty area - go to bottom
      newPosition = (destColumnTasks[destColumnTasks.length - 1]?.position ?? 0) + 1000;
    } else {
      // Dropped on a specific task - find its index
      const overIndex = destColumnTasks.findIndex((t) => t.id === overId);
      
      if (overIndex === -1) {
        // Task not found (shouldn't happen) - go to bottom
        newPosition = (destColumnTasks[destColumnTasks.length - 1]?.position ?? 0) + 1000;
      } else if (overIndex === 0) {
        // Dropped at TOP - position = firstTask.position / 2
        newPosition = (destColumnTasks[0]?.position ?? 1000) / 2;
      } else {
        // Dropped BETWEEN tasks - position = (A.position + B.position) / 2
        const prevPos = destColumnTasks[overIndex - 1]?.position ?? 0;
        const nextPos = destColumnTasks[overIndex]?.position ?? prevPos + 2000;
        newPosition = (prevPos + nextPos) / 2;
      }
    }

    console.log(`MOVE: "${activeTaskItem.title}" → ${overContainer} @ position ${newPosition}`);

    // Optimistic UI update
    setTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === activeId
          ? { ...task, status: overContainer, position: newPosition }
          : task
      );
      return updated.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });

    // Toast feedback
    const prettyStatus = columns.find((c) => c.status === overContainer)?.title ?? overContainer;
    toast({
      title: "Task moved",
      description: `"${activeTaskItem.title}" moved to ${prettyStatus}`,
    });

    // === SINGLE DATABASE UPDATE - NO LOCAL REORDER FUNCTIONS ===
    void updateTaskStatus(activeId, overContainer, newPosition);
  };

  const handleAddTask = (status: string) => {
    setDefaultStatus(status);
    setDialogOpen(true);
  };
  
  const handleFloatingNewTask = () => {
    setDefaultStatus("todo");
    setDialogOpen(true);
  };

  const handleNewTask = async (taskData: { 
    title: string; 
    description: string;
    status: string;
    priority: string;
    tagIds: string[];
    assigneeIds: string[];
    dueDate: Date | null;
  }) => {
    const createdTask = await createTask(taskData);
    
    if (currentProject?.id && taskData.assigneeIds.length > 0 && createdTask && createNotification) {
      await createNotification(
        currentProject.id,
        taskData.assigneeIds,
        "task_created",
        "New task assigned",
        `You have been assigned to "${taskData.title}"`,
        createdTask.id
      );
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailsDialogOpen(true);
  };

  const handleUpdateTask = (taskId: string, updates: { 
    title: string; 
    description: string; 
    priority: string;
    tagIds: string[];
    assigneeIds: string[];
    dueDate: Date | null;
  }) => {
    updateTask(taskId, updates);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Create a project to get started</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-4"} gap-4 h-full pb-24 px-4 md:px-6 w-full ${isMobile || isTablet ? "overflow-y-auto" : ""}`}>
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);
            return (
              <KanbanColumn
                key={column.id}
                title={column.title}
                count={columnTasks.length}
                tasks={columnTasks}
                status={column.status}
                onAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
      
      {/* Floating New Task Button for Mobile/Tablet */}
      {(isMobile || isTablet) && currentProject && (
        <button
          onClick={handleFloatingNewTask}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(var(--nav-bg))] border border-[hsl(var(--nav-border))] flex items-center justify-center shadow-lg hover:bg-[hsl(var(--nav-bg-hover))] transition-colors"
          aria-label="New Task"
        >
          <Plus className={`w-6 h-6 ${isLightMode ? "text-foreground" : "text-foreground"}`} />
        </button>
      )}
      
      <NewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleNewTask}
        defaultStatus={defaultStatus}
        project={currentProject}
      />
      
      <TaskDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        task={tasks.find((t) => t.id === selectedTask?.id) || selectedTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        project={currentProject}
      />
    </>
  );
};

export default KanbanBoard;
