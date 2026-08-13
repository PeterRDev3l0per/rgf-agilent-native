import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/components/dashboard/TaskCard";

const mapStateToStatus = (state: string): Task["status"] => {
  switch (state) {
    case "In Progress":
    case "inprogress":
      return "inprogress";
    case "Verification":
    case "client_approval":
      return "client_approval";
    case "Done":
    case "done":
      return "done";
    case "Backlog":
    case "todo":
    default:
      return "todo";
  }
};

const mapStatusToState = (status: Task["status"]): string => {
  switch (status) {
    case "inprogress":
      return "In Progress";
    case "client_approval":
      return "Verification";
    case "done":
      return "Done";
    case "todo":
    default:
      return "Backlog";
  }
};

const DEFAULT_TASKS: Task[] = [
  {
    id: "e2e-task-1",
    title: "Agilent Native Architecture & Spec Setup 🚀",
    description: "Defined 3-layer architecture, OpenSpec contract, and FastMCP schema.",
    tags: [{ id: "t1", name: "Core", color: "#0284c7" }],
    assignees: [],
    dueDate: "Aug 12",
    taskNumber: 1,
    status: "done",
    priority: "high",
    position: 0,
    project_id: "rgf-agilent-native",
  },
  {
    id: "e2e-task-2",
    title: "FastMCP Gateway & SQLite DB Engine ⚡",
    description: "Implemented FastMCP server with track_event and sync_change tools.",
    tags: [{ id: "t2", name: "Backend", color: "#22c55e" }],
    assignees: [],
    dueDate: "Aug 15",
    taskNumber: 2,
    status: "inprogress",
    priority: "medium",
    position: 1,
    project_id: "rgf-agilent-native",
  },
];

export const useTasks = (
  projectId: string | null,
  onTaskStatusChanged?: (task: Task, newStatus: Task["status"]) => void
) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [loading, setLoading] = useState(false);

  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks(DEFAULT_TASKS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/board`);
      if (res.ok) {
        const data = await res.json();
        const board = data.board || {};
        const apiTasks: Task[] = [];
        let taskNumCounter = 1;

        Object.entries(board).forEach(([colState, items]: [string, any]) => {
          const mappedStatus = mapStateToStatus(colState);
          (items || []).forEach((item: any) => {
            apiTasks.push({
              id: item.id,
              title: item.title,
              description: item.description_html || "",
              tags: item.category
                ? item.category.split(",").filter(Boolean).map((cat: string) => ({ id: cat, name: cat, color: "#0284c7" }))
                : [],
              assignees: item.assignee ? [{ id: item.assignee, name: item.assignee }] : [],
              dueDate: item.target_date || "No due date",
              taskNumber: taskNumCounter++,
              status: mappedStatus,
              priority: (item.priority?.toLowerCase() as any) || "medium",
              position: 0,
              project_id: projectId,
              start_date: item.start_date,
              target_date: item.target_date,
            });
          });
        });

        if (apiTasks.length > 0) {
          setTasks(apiTasks);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Fetch tasks API failed, using fallback:", e);
    }

    setTasks(DEFAULT_TASKS);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskStatus = async (
    taskId: string,
    newStatus: Task["status"],
    newPosition?: number
  ) => {
    const taskBeforeUpdate = tasksRef.current.find(t => t.id === taskId);

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, position: newPosition ?? task.position }
          : task
      )
    );

    const targetState = mapStatusToState(newStatus);
    try {
      const res = await fetch(`/api/work_items/${taskId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: targetState }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      if (taskBeforeUpdate && onTaskStatusChanged) {
        onTaskStatusChanged(taskBeforeUpdate, newStatus);
      }
    } catch (error: any) {
      console.error("Error updating task status:", error);
      fetchTasks();
    }
  };

  const reorderTasks = async (activeId: string, overId: string) => {
    const currentTasks = tasksRef.current;
    const activeTask = currentTasks.find((t) => t.id === activeId);
    const overTask = currentTasks.find((t) => t.id === overId);

    if (!activeTask || !overTask) return;

    setTasks((prev) => {
      const activeIdx = prev.findIndex((t) => t.id === activeId);
      const overIdx = prev.findIndex((t) => t.id === overId);
      if (activeIdx < 0 || overIdx < 0) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(activeIdx, 1);
      updated.splice(overIdx, 0, moved);
      return updated;
    });
  };

  const createTask = async (taskData: {
    title: string;
    description?: string;
    status: string;
    priority?: string;
    tagIds?: string[];
    assigneeIds?: string[];
    dueDate?: Date | null;
  }) => {
    if (!projectId) return null;

    const targetState = mapStatusToState(taskData.status as Task["status"]);
    try {
      const res = await fetch("/api/work_items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_slug: projectId,
          title: taskData.title,
          description: taskData.description || "",
          state: targetState,
          priority: taskData.priority || "medium",
          category: taskData.tagIds?.[0] || "",
          assignee: taskData.assigneeIds?.[0] || "user-pedro",
          target_date: taskData.dueDate ? taskData.dueDate.toISOString().split("T")[0] : "",
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");
      const result = await res.json();
      const createdItem = result.work_item;

      await fetchTasks();

      return {
        id: createdItem.id,
        title: createdItem.title,
        assigneeIds: taskData.assigneeIds || [],
      };
    } catch (error: any) {
      console.error("Error creating task:", error);
      return null;
    }
  };

  const updateTask = async (taskId: string, updates: {
    title?: string;
    description?: string;
    priority?: string;
    tagIds?: string[];
    assigneeIds?: string[];
    dueDate?: Date | null;
  }) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updated = { ...t };
        if (updates.title !== undefined) updated.title = updates.title;
        if (updates.description !== undefined) updated.description = updates.description;
        if (updates.priority !== undefined) updated.priority = updates.priority;
        if (updates.dueDate !== undefined) {
          updated.dueDate = updates.dueDate ? updates.dueDate.toISOString().split("T")[0] : "No due date";
        }
        if (updates.tagIds !== undefined) {
          updated.tags = updates.tagIds.map((id) => ({ id, name: id, color: "#0284c7" }));
        }
        if (updates.assigneeIds !== undefined) {
          updated.assignees = updates.assigneeIds.map((id) => ({ id, name: id }));
        }
        return updated;
      })
    );

    try {
      const payload: Record<string, any> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description_html = updates.description;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.dueDate !== undefined) {
        payload.target_date = updates.dueDate ? updates.dueDate.toISOString().split("T")[0] : "";
      }
      if (updates.tagIds !== undefined) payload.category = updates.tagIds.join(",");
      if (updates.assigneeIds !== undefined) payload.assignee = updates.assigneeIds[0] || "";

      const res = await fetch(`/api/work_items/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update task");
      await fetchTasks();
    } catch (error: any) {
      console.error("Error updating task:", error);
      fetchTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      const res = await fetch(`/api/work_items/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");

      toast({
        title: "Tarea eliminada",
        description: "La tarea fue eliminada de SQLite",
      });
    } catch (error: any) {
      fetchTasks();
      toast({
        title: "Error al eliminar tarea",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    tasks,
    loading,
    setTasks,
    updateTaskStatus,
    reorderTasks,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
};
